'use strict';
const {v4: uuidv4} = require('uuid');

module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();

        const rooms = [
            {id: "11111111-1111-1111-1111-111111111111", hourlyPrice: 50.000},
            {id: "11111111-1111-1111-1111-111111111112", hourlyPrice: 100.000},
            {id: "11111111-1111-1111-1111-111111111113", hourlyPrice: 150.000},
            {id: "22222222-2222-2222-2222-222222222221", hourlyPrice: 50.000},
            {id: "22222222-2222-2222-2222-222222222222", hourlyPrice: 100.000},
            {id: "22222222-2222-2222-2222-222222222223", hourlyPrice: 150.000},
            {id: "33333333-3333-3333-3333-333333333331", hourlyPrice: 50.000},
            {id: "33333333-3333-3333-3333-333333333332", hourlyPrice: 100.000},
            {id: "33333333-3333-3333-3333-333333333333", hourlyPrice: 150.000},
            {id: "44444444-4444-4444-4444-444444444441", hourlyPrice: 50.000},
            {id: "44444444-4444-4444-4444-444444444442", hourlyPrice: 100.000},
            {id: "44444444-4444-4444-4444-444444444443", hourlyPrice: 150.000},
            {id: "55555555-5555-5555-5555-555555555551", hourlyPrice: 50.000},
            {id: "55555555-5555-5555-5555-555555555552", hourlyPrice: 100.000},
            {id: "55555555-5555-5555-5555-555555555553", hourlyPrice: 150.000},
            {id: "66666666-6666-6666-6666-666666666661", hourlyPrice: 50.000},
            {id: "66666666-6666-6666-6666-666666666662", hourlyPrice: 100.000},
            {id: "66666666-6666-6666-6666-666666666663", hourlyPrice: 150.000},
            {id: "77777777-7777-7777-7777-777777777771", hourlyPrice: 50.000},
            {id: "77777777-7777-7777-7777-777777777772", hourlyPrice: 100.000},
            {id: "77777777-7777-7777-7777-777777777773", hourlyPrice: 150.000},
            {id: "88888888-8888-8888-8888-888888888881", hourlyPrice: 50.000},
            {id: "88888888-8888-8888-8888-888888888882", hourlyPrice: 100.000},
            {id: "88888888-8888-8888-8888-888888888883", hourlyPrice: 150.000},
            {id: "99999999-9999-9999-9999-999999999991", hourlyPrice: 50.000},
            {id: "99999999-9999-9999-9999-999999999992", hourlyPrice: 100.000},
            {id: "99999999-9999-9999-9999-999999999993", hourlyPrice: 150.000},
            {id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1", hourlyPrice: 50.000},
            {id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2", hourlyPrice: 100.000},
            {id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3", hourlyPrice: 150.000},
        ];

        const customers = [
            "123e4501-e89b-12d3-a456-426614174000",
            "123e4502-e89b-12d3-a456-426614174000",
            "123e4503-e89b-12d3-a456-426614174000",
            "123e4504-e89b-12d3-a456-426614174000",
            "123e4505-e89b-12d3-a456-426614174000",
            "123e4506-e89b-12d3-a456-426614174000",
            "123e4507-e89b-12d3-a456-426614174000",
            "123e4508-e89b-12d3-a456-426614174000",
            "123e4509-e89b-12d3-a456-426614174000",
            "123e4010-e89b-12d3-a456-426614174000",
            "123e4011-e89b-12d3-a456-426614174000",
            "123e4012-e89b-12d3-a456-426614174000",
            "123e4013-e89b-12d3-a456-426614174000",
            "123e4014-e89b-12d3-a456-426614174000",
            "123e4015-e89b-12d3-a456-426614174000",
            "123e4016-e89b-12d3-a456-426614174000",
            "123e4017-e89b-12d3-a456-426614174000",
            "123e4018-e89b-12d3-a456-426614174000",
            "123e4019-e89b-12d3-a456-426614174000",
        ];

        // Helper function to get random customer
        const getRandomCustomer = () => {
            return customers[Math.floor(Math.random() * customers.length)];
        };

        // Helper function to create date range
        const getDateRange = (startDate, endDate) => {
            const dates = [];
            let currentDate = new Date(startDate);
            const end = new Date(endDate);

            while (currentDate <= end) {
                dates.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }

            return dates;
        };

        // Generate bookings
        const bookings = [];
        const startDate = '2025-10-01';
        const endDate = '2025-12-01';
        const dates = getDateRange(startDate, endDate);

        // Time slots for random selection
        const timeSlots  = [
            {start: 8, end: 13},   // 08:00 - 13:00 (5 hours)
            {start: 9, end: 12},   // 09:00 - 12:00 (3 hours)
            {start: 10, end: 14},  // 10:00 - 14:00 (4 hours)
            {start: 13, end: 17},  // 13:00 - 17:00 (4 hours)
            {start: 14, end: 19},  // 14:00 - 19:00 (5 hours)
            {start: 15, end: 18},  // 15:00 - 18:00 (3 hours)
        ];

        // Generate 1 booking per room per day
        for (const date of dates) {
            for (const room of rooms) {
                // Get random time slot
                const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];

                // Create start and end datetime
                const startTime = new Date(date);
                startTime.setHours(timeSlot.start, 0, 0, 0);

                const endTime = new Date(date);
                endTime.setHours(timeSlot.end, 0, 0, 0);

                // Calculate duration and price
                const durationHours = timeSlot.end - timeSlot.start;
                const totalPrice = durationHours * room.hourlyPrice;

                bookings.push({
                    id: uuidv4(),
                    room_id: room.id,
                    customer_id: getRandomCustomer(),
                    start_time: startTime,
                    end_time: endTime,
                    status: 'completed',
                    total_price: totalPrice,
                    promotion_id: null,
                    createdAt: now,
                    updatedAt: now,
                });
            }
        }

        // Insert bookings in batches to avoid query size limits
        const batchSize = 500;
        for (let i = 0; i < bookings.length; i += batchSize) {
            const batch = bookings.slice(i, i + batchSize);
            await queryInterface.bulkInsert('bookings', batch, {});
        }

        console.log(`✓ Seeded ${bookings.length} bookings (1 per room per day from ${startDate} to ${endDate})`);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('bookings', null, {});
    }
};