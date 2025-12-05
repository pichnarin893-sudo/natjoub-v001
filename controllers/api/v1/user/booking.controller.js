const { bookings, rooms, branches, users, promotions, sequelize, room_promotions, branch_promotions } = require('../../../../models');
const { Op } = require('sequelize');
const moment = require('moment');

class BookingController {

    async createBooking(bookingData) {
        //here i change const to let, so we can apply modify the promotion value
        let {
            userId,
            roomId,
            startTime,
            endTime,
            promotionId = null
        } = bookingData;

        const transaction = await sequelize.transaction();

        try {
            if (!userId || !roomId || !startTime || !endTime) {
                throw new Error('Missing required fields');
            }

            // ✅ FIXED: Parse times correctly
            // If time string has 'Z' suffix, it's already UTC - use as-is
            // If time string has no timezone, JavaScript treats it as LOCAL time
            const cambodiaTimezone = 'Asia/Phnom_Penh';
            const start = new Date(startTime);
            const end = new Date(endTime);

            console.log('[BookingController] 🕐 Received times:');
            console.log('  Input start:', startTime);
            console.log('  Input end:', endTime);
            console.log('  Start (Cambodia):', start.toLocaleString('en-US', { timeZone: cambodiaTimezone }));
            console.log('  End (Cambodia):', end.toLocaleString('en-US', { timeZone: cambodiaTimezone }));

            if (start >= end) {
                throw new Error('Start time must be before end time');
            }

            // Compare with current time
            const now = new Date();
            if (start < now) {
                throw new Error('Cannot book in the past');
            }

            // Get room and branch
            const room = await rooms.findByPk(roomId, {
                include: [{
                    model: branches,
                    as: 'branch',
                    attributes: ['id', 'branch_name', 'work_days', 'open_times', 'close_times', 'is_active']
                }],
                transaction
            });

            if (!room) throw new Error('Room not found');
            if (!room.is_available) throw new Error('Room is not available');
            if (!room.branch.is_active) throw new Error('Branch is not active');

            // Validate branch hours (using Cambodia time for validation)
            this._validateBranchHours(start, end, room.branch);

            // Check for overlaps
            const hasOverlap = await this._checkOverlap(roomId, start, end, null, transaction);
            if (hasOverlap) throw new Error('Time slot is already booked');

            // Calculate price
            const durationHours = (end - start) / (1000 * 60 * 60);
            let totalPrice = room.price_per_hour * durationHours;

            // Apply promotion
            // if (promotionId) {
            //     const promotion = await promotions.findByPk(promotionId, { transaction });
            //     if (promotion && promotion.is_active) {
            //         const now = new Date();
            //         if (now >= promotion.start_date && now <= promotion.end_date) {
            //             totalPrice = totalPrice - (totalPrice * promotion.discount_percent / 100);
            //         }
            //     }
            // }

            //**
            //* My apply promtion flow, bro can uncommand your code and impliment your own kor ban 
            //***

            // -------------------
            // Promotion Logic
            // -------------------
            let appliedPromotionId = null;
            let promotion = null;

            // 1️. Room-specific promotion
            promotion = await room_promotions.findOne({
                where: { room_id: roomId },
                include: [{
                    model: promotions,
                    as: 'promotion',
                    where: {
                        is_active: true,
                        start_date: { [Op.lte]: start },
                        end_date: { [Op.gte]: end }
                    }
                }],
                transaction
            });

            // 2️. Branch promotion
            if (!promotion) {
                promotion = await branch_promotions.findOne({
                    where: { branch_id: room.branch.id },
                    include: [{
                        model: promotions,
                        as: 'promotion',
                        where: {
                            is_active: true,
                            start_date: { [Op.lte]: start },
                            end_date: { [Op.gte]: end }
                        }
                    }],
                    transaction
                });
            }

            // 3️. Global promotion
            if (!promotion) {
                promotion = await promotions.findOne({
                    where: {
                        target_type: 'global',
                        is_active: true,
                        start_date: { [Op.lte]: start },
                        end_date: { [Op.gte]: end }
                    },
                    transaction
                });
            }

            // 4️. Apply promotion
            if (promotion) {
                if (promotion.promotion && promotion.promotion.id) {
                    appliedPromotionId = promotion.promotion.id; // room or branch promotion
                    totalPrice = totalPrice - (totalPrice * promotion.promotion.discount_percent / 100);
                } else if (promotion.id) {
                    appliedPromotionId = promotion.id; // global promotion
                    totalPrice = totalPrice - (totalPrice * promotion.discount_percent / 100);
                }
            }

            const booking = await bookings.create({
                customer_id: userId,
                room_id: roomId,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                total_price: totalPrice.toFixed(3), // format as string with 3 decimals
                promotion_id: appliedPromotionId,
                status: 'pending'
            }, { transaction });

            // const booking = await bookings.create({ 
            //     customer_id: userId, 
            //     room_id: roomId, 
            //     start_time: start.toISOString(), 
            //     end_time: end.toISOString(), 
            //     total_price: totalPrice, 
            //     promotion_id: promotionId, 
            //     status: 'pending' 
            // }, { transaction });

            await transaction.commit();

            console.log('[BookingController] ✅ Booking created:');
            console.log('  ID:', booking.id);
            console.log('  Start stored (UTC):', booking.start_time);
            console.log('  End stored (UTC):', booking.end_time);

            return await this.getBookingById(booking.id);

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async getBookingById(bookingId) {
        return await bookings.findByPk(bookingId, {
            include: [
                {
                    model: users,
                    as: 'customer',
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: rooms,
                    as: 'room',
                    attributes: ['id', 'room_no', 'people_capacity', 'price_per_hour'],
                    include: [{
                        model: branches,
                        as: 'branch',
                        attributes: ['id', 'branch_name', 'address']
                    }]
                },
                {
                    model: promotions,
                    as: 'promotion',
                    attributes: ['id', 'title', 'discount_percent']
                }
            ]
        });
    }

    async cancelBooking(bookingId, userId, userRole = 'customer') {
        const transaction = await sequelize.transaction();
        try {
            const booking = await bookings.findByPk(bookingId, { transaction });
            if (!booking) throw new Error('Booking not found');
            if (booking.status === 'cancelled') throw new Error('Already cancelled');
            if (userRole !== 'admin' && booking.customer_id !== userId) {
                throw new Error('Unauthorized');
            }

            await booking.update({ status: 'cancelled' }, { transaction });
            await transaction.commit();

            return await this.getBookingById(bookingId);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async getUserBookings(userId, options = {}) {
        const { status, limit = 50 } = options;
        const whereClause = { customer_id: userId };
        if (status) whereClause.status = status;

        return await bookings.findAll({
            where: whereClause,
            include: [
                {
                    model: rooms,
                    as: 'room',
                    include: [{
                        model: branches,
                        as: 'branch',
                        attributes: ['id', 'branch_name', 'address']
                    }]
                },
                {
                    model: promotions,
                    as: 'promotion',
                    attributes: ['id', 'title', 'discount_percent']
                }
            ],
            order: [['start_time', 'DESC']],
            limit
        });
    }

    async getRoomBookings(roomId, date = null) {
        const whereClause = {
            room_id: roomId,
            status: { [Op.ne]: 'cancelled' }
        };

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            whereClause.start_time = { [Op.between]: [startOfDay, endOfDay] };
        }

        return await bookings.findAll({
            where: whereClause,
            include: [{ model: users, as: 'customer', attributes: ['id', 'first_name', 'last_name'] }],
            order: [['start_time', 'ASC']]
        });
    }

    async getOccupiedRoomBookingTimes(roomId, date, bookingStatus) {
        try {
            const room = await rooms.findOne({
                where: { id: roomId },
                include: [
                    {
                        model: branches,
                        as: 'branch',
                        attributes: [
                            'id',
                            'branch_name',
                            'open_times',
                            'close_times',
                            'work_days',
                            'address'
                        ]
                    }
                ]
            });

            if (!room) {
                throw new Error('Room not found');
            }

            let bookingConditions = {
                room_id: roomId,
                status: bookingStatus ? bookingStatus : 'confirmed'
            }

            // If date is provided, filter bookings for that specific date
            if (date) {
                const startOfDay = moment(date).startOf('day').toDate();
                const endOfDay = moment(date).endOf('day').toDate();

                bookingConditions.start_time = {
                    [Op.gte]: startOfDay,
                    [Op.lt]: endOfDay
                };
            } else {
                // Show only future and current bookings
                bookingConditions.end_time = {
                    [Op.gte]: new Date()
                };
            }

            // Get all confirmed bookings for this room
            const confirmedBookings = await bookings.findAll({
                where: bookingConditions,
                order: [['start_time', 'ASC']],
                attributes: [
                    'id',
                    'start_time',
                    'end_time',
                    'total_price',
                    'status',
                    'createdAt'
                ]
            });

            // Format the booked time slots
            const bookedTimeSlots = confirmedBookings.map(booking => {
                const startTime = moment(booking.start_time);
                const endTime = moment(booking.end_time);

                return {
                    time_slot: `${startTime.format('h:mma')} - ${endTime.format('h:mma')}`,
                    start_time: startTime.format('YYYY-MM-DD HH:mm:ss'),
                    end_time: endTime.format('YYYY-MM-DD HH:mm:ss'),
                    duration_hours: moment.duration(endTime.diff(startTime)).asHours(),
                    is_current: moment().isBetween(startTime, endTime)
                };
            });

            return {
                booked_time_slots: bookedTimeSlots,
                note: 'These are confirmed (paid) bookings. You cannot book during these times.'
            };


        } catch (error) {
            console.error('Error in getOccupiedRoomBookingTimes:', error);
            throw error;
        }
    }

    async _checkOverlap(roomId, startTime, endTime, excludeBookingId = null, transaction = null) {
        const whereClause = {
            room_id: roomId,
            status: { [Op.notIn]: ['cancelled'] },
            [Op.or]: [
                { start_time: { [Op.lte]: startTime }, end_time: { [Op.gt]: startTime } },
                { start_time: { [Op.lt]: endTime }, end_time: { [Op.gte]: endTime } },
                { start_time: { [Op.gte]: startTime }, end_time: { [Op.lte]: endTime } }
            ]
        };

        if (excludeBookingId) whereClause.id = { [Op.ne]: excludeBookingId };

        const overlapping = await bookings.findOne({ where: whereClause, transaction });
        return overlapping !== null;
    }

    _validateBranchHours(startTime, endTime, branch) {
        const cambodiaTimezone = 'Asia/Phnom_Penh';

        // Convert start and end to Cambodia time for validation
        const startLocal = new Date(startTime.toLocaleString('en-US', { timeZone: cambodiaTimezone }));
        const endLocal = new Date(endTime.toLocaleString('en-US', { timeZone: cambodiaTimezone }));

        const dayOfWeek = startLocal.toLocaleDateString('en-US', { weekday: 'long', timeZone: cambodiaTimezone }).toLowerCase();

        if (!branch.work_days.map(d => d.toLowerCase()).includes(dayOfWeek)) {
            throw new Error(`Branch is closed on ${dayOfWeek}`);
        }

        const [openHour, openMin] = branch.open_times.split(':').map(Number);
        const [closeHour, closeMin] = branch.close_times.split(':').map(Number);

        const startMinutes = startLocal.getHours() * 60 + startLocal.getMinutes();
        const endMinutes = endLocal.getHours() * 60 + endLocal.getMinutes();
        const openMinutes = openHour * 60 + openMin;
        const closeMinutes = closeHour * 60 + closeMin;

        if (startMinutes < openMinutes) throw new Error(`Branch opens at ${branch.open_times}`);
        if (endMinutes > closeMinutes) throw new Error(`Branch closes at ${branch.close_times}`);
    }

}

module.exports = new BookingController();
