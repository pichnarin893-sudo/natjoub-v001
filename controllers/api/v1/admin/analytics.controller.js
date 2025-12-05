const { Op, fn, col, literal } = require('sequelize');
const { users, branches, rooms, bookings, roles, sequelize } = require('../../../../models');

class AnalyticsController {
    /**
     * ===========================================
     * ADMIN ANALYTICS
     * ===========================================
     */

    /**
     * Get platform-wide overview statistics
     * @param {Object} filters - { startDate, endDate }
     */
    async getAdminOverview(filters = {}) {
        const { startDate, endDate } = filters;
        const dateFilter = this._buildDateFilter(startDate, endDate);

        const [
            totalRevenue,
            totalBookings,
            totalBranches,
            totalRooms,
            totalCustomers,
            activeOwners,
            averageBookingValue,
            completionRate
        ] = await Promise.all([
            // Total Revenue
            bookings.sum('total_price', {
                where: {
                    status: 'completed',
                    ...dateFilter
                }
            }),

            // Total Bookings
            bookings.count({
                where: dateFilter
            }),

            // Total Branches
            branches.count({
                where: { is_active: true }
            }),

            // Total Rooms
            rooms.count({
                where: { is_available: true }
            }),

            // Total Customers (count distinct customer_ids from bookings)
            bookings.count({
                distinct: true,
                col: 'customer_id'
            }),

            // Active Store Owners (users who own active branches)
            branches.count({
                distinct: true,
                col: 'owner_id',
                where: { is_active: true }
            }),

            // Average Booking Value
            bookings.findOne({
                attributes: [
                    [fn('AVG', col('total_price')), 'avgValue']
                ],
                where: {
                    status: 'completed',
                    ...dateFilter
                },
                raw: true
            }),

            // Completion Rate
            this._getCompletionRate(dateFilter)
        ]);

        return {
            revenue: {
                total: parseFloat(totalRevenue) || 0,
                average: parseFloat(averageBookingValue?.avgValue) || 0
            },
            bookings: {
                total: totalBookings,
                completionRate: completionRate
            },
            platform: {
                branches: totalBranches,
                rooms: totalRooms,
                customers: totalCustomers,
                activeOwners: activeOwners
            }
        };
    }

    /**
     * Get revenue trends over time
     * @param {Object} filters - { startDate, endDate, groupBy: 'day'|'week'|'month' }
     */
    async getAdminRevenueTrends(filters = {}) {
        const { startDate, endDate, groupBy = 'day' } = filters;
        const dateFilter = this._buildDateFilter(startDate, endDate);

        const trends = await bookings.findAll({
            attributes: [
                [fn('DATE_TRUNC', groupBy, col('start_time')), 'period'],
                [fn('SUM', col('total_price')), 'revenue'],
                [fn('COUNT', col('id')), 'bookingCount'],
                [fn('AVG', col('total_price')), 'avgBookingValue']
            ],
            where: {
                status: 'completed',
                ...dateFilter
            },
            group: [literal(`DATE_TRUNC('${groupBy}', start_time)`)],
            order: [[literal('period'), 'ASC']],
            raw: true
        });

        return trends.map(trend => ({
            period: trend.period,
            revenue: parseFloat(trend.revenue),
            bookingCount: parseInt(trend.bookingCount),
            avgBookingValue: parseFloat(trend.avgBookingValue)
        }));
    }

    /**
     * Get top performing branches
     * @param {Object} filters - { startDate, endDate, limit: 10 }
     */
    async getTopBranches(filters = {}) {
        const { startDate, endDate, limit = 10 } = filters;
        const dateFilter = this._buildDateFilter(startDate, endDate);

        // Build date condition for subquery
        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND bookings.start_time BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateCondition = `AND bookings.start_time >= '${startDate}'`;
        } else if (endDate) {
            dateCondition = `AND bookings.start_time <= '${endDate}'`;
        }

        const query = `
            SELECT 
                b.id as "branchId",
                b.branch_name as "branchName",
                b.address,
                u.first_name || ' ' || u.last_name as "ownerName",
                COUNT(bk.id) as "totalBookings",
                COALESCE(SUM(bk.total_price), 0) as "totalRevenue",
                COALESCE(AVG(bk.total_price), 0) as "avgBookingValue"
            FROM branches b
            INNER JOIN users u ON b.owner_id = u.id
            LEFT JOIN rooms r ON b.id = r.branch_id
            LEFT JOIN bookings bk ON r.id = bk.room_id 
                AND bk.status = 'completed'
                ${dateCondition}
            WHERE b.is_active = true
            GROUP BY b.id, b.branch_name, b.address, u.first_name, u.last_name
            HAVING COUNT(bk.id) > 0
            ORDER BY "totalRevenue" DESC
            LIMIT :limit
        `;

        const results = await sequelize.query(query, {
            replacements: { limit },
            type: sequelize.QueryTypes.SELECT
        });

        return results.map(branch => ({
            branchId: branch.branchId,
            branchName: branch.branchName,
            address: branch.address,
            ownerName: branch.ownerName,
            metrics: {
                totalBookings: parseInt(branch.totalBookings),
                totalRevenue: parseFloat(branch.totalRevenue),
                avgBookingValue: parseFloat(branch.avgBookingValue)
            }
        }));
    }

    /**
     * Get booking status distribution
     * @param {Object} filters - { startDate, endDate }
     */
    async getBookingStatusDistribution(filters = {}) {
        const { startDate, endDate } = filters;
        const dateFilter = this._buildDateFilter(startDate, endDate);

        const distribution = await bookings.findAll({
            attributes: [
                'status',
                [fn('COUNT', col('id')), 'count'],
                [fn('SUM', col('total_price')), 'revenue']
            ],
            where: dateFilter,
            group: ['status'],
            raw: true
        });

        return distribution.map(item => ({
            status: item.status,
            count: parseInt(item.count),
            revenue: parseFloat(item.revenue) || 0
        }));
    }

    /**
     * Get customer analytics
     * @param {Object} filters - { startDate, endDate, limit: 10 }
     */
    async getTopCustomers(filters = {}) {
        const { startDate, endDate, limit = 10 } = filters;
        const dateFilter = this._buildDateFilter(startDate, endDate);

        const topCustomers = await users.findAll({
            attributes: [
                'id',
                'first_name',
                'last_name',
                [fn('COUNT', col('customer_bookings.id')), 'totalBookings'],
                [fn('SUM', col('customer_bookings.total_price')), 'totalSpent'],
                [fn('AVG', col('customer_bookings.total_price')), 'avgSpent']
            ],
            include: [{
                model: bookings,
                as: 'customer_bookings',
                attributes: [],
                where: {
                    status: 'completed',
                    ...dateFilter
                },
                required: true
            }],
            group: ['users.id'],
            order: [[literal('"totalSpent"'), 'DESC']],
            limit: limit,
            subQuery: false,
            raw: true
        });

        return topCustomers.map(customer => ({
            customerId: customer.id,
            name: `${customer.first_name} ${customer.last_name}`,
            totalBookings: parseInt(customer.totalBookings),
            totalSpent: parseFloat(customer.totalSpent),
            avgSpent: parseFloat(customer.avgSpent)
        }));
    }

    /**
     * Get room utilization rates
     * @param {Object} filters - { startDate, endDate }
     */
    async getRoomUtilization(filters = {}) {
        const { startDate, endDate } = filters;

        // Calculate total available hours for the period
        const daysDiff = this._getDaysDifference(startDate, endDate);

        // Build date condition
        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND bk.start_time BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateCondition = `AND bk.start_time >= '${startDate}'`;
        } else if (endDate) {
            dateCondition = `AND bk.start_time <= '${endDate}'`;
        }

        const query = `
            SELECT 
                r.id as "roomId",
                r.room_no as "roomNo",
                b.branch_name as "branchName",
                b.open_times as "openTimes",
                b.close_times as "closeTimes",
                COUNT(bk.id) as "totalBookings",
                COALESCE(SUM(EXTRACT(EPOCH FROM (bk.end_time - bk.start_time))/3600), 0) as "totalHoursBooked"
            FROM rooms r
            INNER JOIN branches b ON r.branch_id = b.id
            LEFT JOIN bookings bk ON r.id = bk.room_id 
                AND bk.status = 'completed'
                ${dateCondition}
            WHERE r.is_available = true
            GROUP BY r.id, r.room_no, b.branch_name, b.open_times, b.close_times
            ORDER BY "totalHoursBooked" DESC
        `;

        const results = await sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });

        return results.map(room => {
            const hoursPerDay = this._calculateDailyHours(room.openTimes, room.closeTimes);
            const totalAvailableHours = hoursPerDay * daysDiff;
            const utilizationRate = totalAvailableHours > 0
                ? (room.totalHoursBooked / totalAvailableHours) * 100
                : 0;

            return {
                roomId: room.roomId,
                roomNo: room.roomNo,
                branchName: room.branchName,
                totalBookings: parseInt(room.totalBookings),
                hoursBooked: parseFloat(room.totalHoursBooked),
                totalAvailableHours: totalAvailableHours,
                utilizationRate: Math.min(utilizationRate, 100).toFixed(2)
            };
        });
    }

    /**
     * ===========================================
     * STORE OWNER ANALYTICS
     * ===========================================
     */

    /**
     * Get owner dashboard overview
     * @param {String} ownerId - Owner user ID
     * @param {Object} filters - { startDate, endDate }
     */
    async getOwnerOverview(ownerId, filters = {}) {
        const { startDate, endDate } = filters;

        // Build date condition
        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND bk.start_time BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateCondition = `AND bk.start_time >= '${startDate}'`;
        } else if (endDate) {
            dateCondition = `AND bk.start_time <= '${endDate}'`;
        }

        const overviewQuery = `
            SELECT 
                COALESCE(SUM(CASE WHEN bk.status = 'completed' THEN bk.total_price ELSE 0 END), 0) as "totalRevenue",
                COALESCE(AVG(CASE WHEN bk.status = 'completed' THEN bk.total_price ELSE NULL END), 0) as "avgBookingValue",
                COUNT(bk.id) as "totalBookings",
                COUNT(CASE WHEN bk.status = 'completed' THEN 1 END) as "completedBookings",
                COUNT(DISTINCT bk.customer_id) FILTER (WHERE bk.status = 'completed') as "uniqueCustomers"
            FROM branches b
            LEFT JOIN rooms r ON b.id = r.branch_id
            LEFT JOIN bookings bk ON r.id = bk.room_id
                ${dateCondition}
            WHERE b.owner_id = :ownerId AND b.is_active = true
        `;

        const countsQuery = `
            SELECT 
                COUNT(DISTINCT b.id) FILTER (WHERE b.is_active = true) as "totalBranches",
                COUNT(DISTINCT r.id) FILTER (WHERE r.is_available = true) as "totalRooms"
            FROM branches b
            LEFT JOIN rooms r ON b.id = r.branch_id
            WHERE b.owner_id = :ownerId
        `;

        const [overviewResults, countsResults] = await Promise.all([
            sequelize.query(overviewQuery, {
                replacements: { ownerId },
                type: sequelize.QueryTypes.SELECT
            }),
            sequelize.query(countsQuery, {
                replacements: { ownerId },
                type: sequelize.QueryTypes.SELECT
            })
        ]);

        const overview = overviewResults[0];
        const counts = countsResults[0];
        const completionRate = overview.totalBookings > 0
            ? ((overview.completedBookings / overview.totalBookings) * 100).toFixed(2)
            : 0;

        return {
            revenue: {
                total: parseFloat(overview.totalRevenue),
                average: parseFloat(overview.avgBookingValue)
            },
            bookings: {
                total: parseInt(overview.totalBookings),
                completionRate: completionRate
            },
            business: {
                branches: parseInt(counts.totalBranches),
                rooms: parseInt(counts.totalRooms),
                uniqueCustomers: parseInt(overview.uniqueCustomers)
            }
        };
    }

    /**
     * Get owner revenue trends
     * @param {String} ownerId - Owner user ID
     * @param {Object} filters - { startDate, endDate, groupBy }
     */
    async getOwnerRevenueTrends(ownerId, filters = {}) {
        const { startDate, endDate, groupBy = 'day' } = filters;

        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND bk.start_time BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateCondition = `AND bk.start_time >= '${startDate}'`;
        } else if (endDate) {
            dateCondition = `AND bk.start_time <= '${endDate}'`;
        }

        const query = `
            SELECT 
                DATE_TRUNC('${groupBy}', bk.start_time) as period,
                SUM(bk.total_price) as revenue,
                COUNT(bk.id) as "bookingCount",
                AVG(bk.total_price) as "avgBookingValue"
            FROM branches b
            INNER JOIN rooms r ON b.id = r.branch_id
            INNER JOIN bookings bk ON r.id = bk.room_id
            WHERE b.owner_id = :ownerId 
                AND bk.status = 'completed'
                ${dateCondition}
            GROUP BY DATE_TRUNC('${groupBy}', bk.start_time)
            ORDER BY period ASC
        `;

        const trends = await sequelize.query(query, {
            replacements: { ownerId },
            type: sequelize.QueryTypes.SELECT
        });

        return trends.map(trend => ({
            period: trend.period,
            revenue: parseFloat(trend.revenue),
            bookingCount: parseInt(trend.bookingCount),
            avgBookingValue: parseFloat(trend.avgBookingValue)
        }));
    }

    /**
     * Get branch performance comparison for owner
     * @param {String} ownerId - Owner user ID
     * @param {Object} filters - { startDate, endDate }
     */
    async getOwnerBranchPerformance(ownerId, filters = {}) {
        const { startDate, endDate } = filters;

        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND bk.start_time BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateCondition = `AND bk.start_time >= '${startDate}'`;
        } else if (endDate) {
            dateCondition = `AND bk.start_time <= '${endDate}'`;
        }

        const query = `
            SELECT 
                b.id as "branchId",
                b.branch_name as "branchName",
                b.address,
                b.room_amount as "roomCount",
                COUNT(bk.id) FILTER (WHERE bk.status = 'completed') as "totalBookings",
                COALESCE(SUM(bk.total_price) FILTER (WHERE bk.status = 'completed'), 0) as "totalRevenue",
                COALESCE(AVG(bk.total_price) FILTER (WHERE bk.status = 'completed'), 0) as "avgBookingValue"
            FROM branches b
            LEFT JOIN rooms r ON b.id = r.branch_id
            LEFT JOIN bookings bk ON r.id = bk.room_id
                ${dateCondition}
            WHERE b.owner_id = :ownerId AND b.is_active = true
            GROUP BY b.id, b.branch_name, b.address, b.room_amount
            ORDER BY "totalRevenue" DESC
        `;

        const results = await sequelize.query(query, {
            replacements: { ownerId },
            type: sequelize.QueryTypes.SELECT
        });

        return results.map(branch => ({
            branchId: branch.branchId,
            branchName: branch.branchName,
            address: branch.address,
            roomCount: parseInt(branch.roomCount),
            metrics: {
                totalBookings: parseInt(branch.totalBookings),
                totalRevenue: parseFloat(branch.totalRevenue),
                avgBookingValue: parseFloat(branch.avgBookingValue)
            }
        }));
    }

    /**
     * Get room performance for specific branch
     * @param {String} branchId - Branch ID
     * @param {Object} filters - { startDate, endDate }
     */
    async getBranchRoomPerformance(branchId, filters = {}) {
        const { startDate, endDate } = filters;

        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND bk.start_time BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateCondition = `AND bk.start_time >= '${startDate}'`;
        } else if (endDate) {
            dateCondition = `AND bk.start_time <= '${endDate}'`;
        }

        const query = `
            SELECT 
                r.id as "roomId",
                r.room_no as "roomNo",
                r.people_capacity as capacity,
                r.price_per_hour as "pricePerHour",
                COUNT(bk.id) FILTER (WHERE bk.status = 'completed') as "totalBookings",
                COALESCE(SUM(bk.total_price) FILTER (WHERE bk.status = 'completed'), 0) as "totalRevenue",
                COALESCE(SUM(EXTRACT(EPOCH FROM (bk.end_time - bk.start_time))/3600) FILTER (WHERE bk.status = 'completed'), 0) as "hoursBooked"
            FROM rooms r
            LEFT JOIN bookings bk ON r.id = bk.room_id
                ${dateCondition}
            WHERE r.branch_id = :branchId
            GROUP BY r.id, r.room_no, r.people_capacity, r.price_per_hour
            ORDER BY "totalRevenue" DESC
        `;

        const results = await sequelize.query(query, {
            replacements: { branchId },
            type: sequelize.QueryTypes.SELECT
        });

        return results.map(room => ({
            roomId: room.roomId,
            roomNo: room.roomNo,
            capacity: parseInt(room.capacity),
            pricePerHour: parseFloat(room.pricePerHour),
            metrics: {
                totalBookings: parseInt(room.totalBookings),
                totalRevenue: parseFloat(room.totalRevenue),
                hoursBooked: parseFloat(room.hoursBooked)
            }
        }));
    }

    /**
     * Get peak hours analysis for owner
     * @param {String} ownerId - Owner user ID
     * @param {Object} filters - { startDate, endDate }
     */
    async getOwnerPeakHours(ownerId, filters = {}) {
        const { startDate, endDate } = filters;

        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND bk.start_time BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateCondition = `AND bk.start_time >= '${startDate}'`;
        } else if (endDate) {
            dateCondition = `AND bk.start_time <= '${endDate}'`;
        }

        const query = `
            SELECT 
                EXTRACT(HOUR FROM bk.start_time) as hour,
                COUNT(bk.id) as "bookingCount",
                SUM(bk.total_price) as revenue
            FROM branches b
            INNER JOIN rooms r ON b.id = r.branch_id
            INNER JOIN bookings bk ON r.id = bk.room_id
            WHERE b.owner_id = :ownerId 
                AND bk.status = 'completed'
                ${dateCondition}
            GROUP BY EXTRACT(HOUR FROM bk.start_time)
            ORDER BY hour ASC
        `;

        const results = await sequelize.query(query, {
            replacements: { ownerId },
            type: sequelize.QueryTypes.SELECT
        });

        return results.map(item => ({
            hour: parseInt(item.hour),
            bookingCount: parseInt(item.bookingCount),
            revenue: parseFloat(item.revenue)
        }));
    }

    /**
     * Get customer insights for owner
     * @param {String} ownerId - Owner user ID
     * @param {Object} filters - { startDate, endDate, limit: 20 }
     */
    async getOwnerCustomerInsights(ownerId, filters = {}) {
        const { startDate, endDate, limit = 20 } = filters;

        let dateCondition = '';
        if (startDate && endDate) {
            dateCondition = `AND bk.start_time BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateCondition = `AND bk.start_time >= '${startDate}'`;
        } else if (endDate) {
            dateCondition = `AND bk.start_time <= '${endDate}'`;
        }

        const query = `
            SELECT 
                u.id as "customerId",
                u.first_name || ' ' || u.last_name as name,
                COUNT(bk.id) as "totalBookings",
                SUM(bk.total_price) as "totalSpent",
                AVG(bk.total_price) as "avgSpent",
                MAX(bk.start_time) as "lastBooking"
            FROM branches b
            INNER JOIN rooms r ON b.id = r.branch_id
            INNER JOIN bookings bk ON r.id = bk.room_id
            INNER JOIN users u ON bk.customer_id = u.id
            WHERE b.owner_id = :ownerId 
                AND bk.status = 'completed'
                ${dateCondition}
            GROUP BY u.id, u.first_name, u.last_name
            ORDER BY "totalSpent" DESC
            LIMIT :limit
        `;

        const results = await sequelize.query(query, {
            replacements: { ownerId, limit },
            type: sequelize.QueryTypes.SELECT
        });

        return results.map(customer => ({
            customerId: customer.customerId,
            name: customer.name,
            totalBookings: parseInt(customer.totalBookings),
            totalSpent: parseFloat(customer.totalSpent),
            avgSpent: parseFloat(customer.avgSpent),
            lastBooking: customer.lastBooking
        }));
    }

    /**
     * ===========================================
     * HELPER METHODS
     * ===========================================
     */

    _buildDateFilter(startDate, endDate) {
        const filter = {};

        if (startDate && endDate) {
            filter.start_time = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            filter.start_time = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            filter.start_time = {
                [Op.lte]: new Date(endDate)
            };
        }

        return filter;
    }

    async _getCompletionRate(dateFilter) {
        const result = await bookings.findOne({
            attributes: [
                [fn('COUNT', col('id')), 'total'],
                [fn('SUM', literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")), 'completed']
            ],
            where: dateFilter,
            raw: true
        });

        if (!result || result.total === 0) return "0.00";
        return ((result.completed / result.total) * 100).toFixed(2);
    }

    _getDaysDifference(startDate, endDate) {
        if (!startDate || !endDate) return 30; // Default to 30 days
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    _calculateDailyHours(openTime, closeTime) {
        if (!openTime || !closeTime) return 12; // Default to 12 hours

        const open = new Date(`1970-01-01T${openTime}`);
        const close = new Date(`1970-01-01T${closeTime}`);
        return (close - open) / (1000 * 60 * 60);
    }
}

module.exports = new AnalyticsController();