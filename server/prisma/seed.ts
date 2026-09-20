import { PrismaClient, Role, AgeRating, MovieFormat, SeatType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CineLight database...');

  // 1. Seed Users (Admin, Staff, Customer)
  console.log('1. Creating Users...');
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cinema.vn' },
    update: {
      role: Role.ADMIN,
      isActive: true,
      assignedCinemaId: null,
    },
    create: {
      email: 'admin@cinema.vn',
      password: hashedPassword,
      name: 'Quản Trị Viên (Admin)',
      phone: '0901112233',
      role: Role.ADMIN,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@cinema.vn' },
    update: {},
    create: {
      email: 'staff@cinema.vn',
      password: hashedPassword,
      name: 'Nhân Viên Soát Vé',
      phone: '0902223344',
      role: Role.STAFF,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'demo@cinema.vn' },
    update: {},
    create: {
      email: 'demo@cinema.vn',
      password: hashedPassword,
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      role: Role.CUSTOMER,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log(`Users created: Admin (${admin.email}), Staff (${staff.email}), Customer (${customer.email})`);

  // 2. Seed Genres
  console.log('2. Creating Genres...');
  const genresList = [
    { name: 'Hành động', slug: 'hanh-dong' },
    { name: 'Khoa học viễn tưởng', slug: 'khoa-hoc-vien-tuong' },
    { name: 'Hoạt hình', slug: 'hoat-hinh' },
    { name: 'Kinh dị', slug: 'kinh-di' },
    { name: 'Phiêu lưu', slug: 'phieu-luu' },
    { name: 'Hài hước', slug: 'hai-huoc' },
    { name: 'Tâm lý', slug: 'tam-ly' },
    { name: 'Gia đình', slug: 'gia-dinh' },
  ];

  const genreMap = new Map<string, string>();
  for (const g of genresList) {
    const genre = await prisma.genre.upsert({
      where: { slug: g.slug },
      update: {},
      create: g,
    });
    genreMap.set(g.name, genre.id);
  }

  // 3. Seed Cinemas, Rooms, and 80-Seat Matrices
  console.log('3. Creating Cinemas, Rooms & Seat Matrices...');
  const cinemasData = [
    {
      name: 'CineLight Landmark 81',
      address: 'Tầng B1, TTTM Vincom Center Landmark 81, 720A Điện Biên Phủ, Q. Bình Thạnh',
      city: 'TP. Hồ Chí Minh',
      phone: '028 7300 8181',
      imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80',
    },
    {
      name: 'CineLight Thủ Đức',
      address: 'Tầng 4, Vincom Plaza Thủ Đức, 216 Võ Văn Ngân, TP. Thủ Đức',
      city: 'TP. Hồ Chí Minh',
      phone: '028 7300 2233',
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
    },
    {
      name: 'CineLight Quận 1',
      address: '135 Hai Bà Trưng, Phường Bến Nghé, Quận 1',
      city: 'TP. Hồ Chí Minh',
      phone: '028 7300 1122',
      imageUrl: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=1200&auto=format&fit=crop&q=80',
    },
  ];

  const allRooms = [];

  for (const cData of cinemasData) {
    let cinema = await prisma.cinema.findFirst({ where: { name: cData.name } });
    if (!cinema) {
      cinema = await prisma.cinema.create({ data: cData });
    }

    const roomTypes = [
      { name: 'Phòng 01 - IMAX Laser', roomType: 'IMAX' },
      { name: 'Phòng 02 - Dolby Atmos', roomType: 'STANDARD' },
      { name: 'Phòng 03 - 3D RealD', roomType: '3D' },
    ];

    for (const rType of roomTypes) {
      let room = await prisma.room.findFirst({
        where: { cinemaId: cinema.id, name: rType.name },
      });

      if (!room) {
        room = await prisma.room.create({
          data: {
            cinemaId: cinema.id,
            name: rType.name,
            roomType: rType.roomType,
            totalSeats: 80,
          },
        });

        // Generate 80 seats (Rows A-H, Cols 1-10)
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const seatsToCreate = [];

        for (const row of rows) {
          let seatType = SeatType.REGULAR;
          if (['E', 'F', 'G'].includes(row)) seatType = SeatType.VIP;
          if (row === 'H') seatType = SeatType.COUPLE;

          for (let col = 1; col <= 10; col++) {
            seatsToCreate.push({
              roomId: room.id,
              seatNumber: `${row}${col}`,
              row,
              col,
              seatType,
            });
          }
        }

        await prisma.seat.createMany({ data: seatsToCreate });
      }

      allRooms.push(room);
    }
  }

  const assignedCinema = await prisma.cinema.findFirst({
    where: { name: cinemasData[0].name },
  });

  if (!assignedCinema) {
    throw new Error('The seeded cinema for the staff account was not found.');
  }

  await prisma.user.update({
    where: { id: staff.id },
    data: {
      role: Role.STAFF,
      isActive: true,
      assignedCinemaId: assignedCinema.id,
    },
  });

  console.log(`Created ${cinemasData.length} cinemas with ${allRooms.length} rooms (80 seats each).`);

  // 4. Seed Real TMDb Movies
  console.log('4. Creating Real TMDb Movies...');
  const sampleMovies = [
    {
      title: 'Coyote vs. Acme',
      originalTitle: 'Coyote vs. Acme',
      description: 'Sau quá nhiều lần thất bại vì những món hàng lỗi của công ty Acme trong cuộc săn đuổi Roadrunner, Wile E. Coyote quyết định thuê một luật sư khởi kiện tập đoàn Acme ra tòa.',
      duration: 103,
      releaseDate: new Date('2026-08-20'),
      poster: 'https://image.tmdb.org/t/p/w780/kYDCl2y0VPvhT5eYWbMRInPoB03.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/7GOW6jod9lLurW5utokAatxg7ql.jpg',
      rating: 7.5,
      ageRating: AgeRating.P,
      trailerUrl: 'https://www.youtube.com/watch?v=HJvgSk8oLls',
      director: 'Dave Green',
      isHot: true,
      isNowShowing: true,
      genres: ['Hài hước', 'Hoạt hình', 'Gia đình'],
    },
    {
      title: 'Ngày Tàn Của Phố Oak',
      originalTitle: 'The End of Oak Street',
      description: 'Sau khi một thảm họa thiên nhiên xé toạc Phố Oak khỏi khu ngoại ô và đưa con phố đến một nơi xa lạ, gia đình Platt nhận ra chỉ có đứng bên nhau mới vượt qua vận mệnh.',
      duration: 112,
      releaseDate: new Date('2026-08-12'),
      poster: 'https://image.tmdb.org/t/p/w780/fprITg7E3v7Hj9wGKmCXCBVLSHq.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/b9q9VmbXDvJmTziRqkwdEmFdwhr.jpg',
      rating: 6.9,
      ageRating: AgeRating.T16,
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      director: 'David F. Sandberg',
      isHot: true,
      isNowShowing: true,
      genres: ['Khoa học viễn tưởng', 'Hành động', 'Tâm lý'],
    },
    {
      title: 'Bầy Xác Sống',
      originalTitle: '군체',
      description: 'Giáo sư Se Jeong tham dự một hội nghị công nghệ sinh học, nhưng lại chứng kiến nó biến thành thảm họa khi một loại virus đột biến nhanh chóng được giải phóng ra cộng đồng.',
      duration: 125,
      releaseDate: new Date('2026-05-21'),
      poster: 'https://image.tmdb.org/t/p/w780/lzI70txBtLH5kCUixYMJQffKkL9.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/hpBGCnzOvdtQoMyE48gvwp2y5yx.jpg',
      rating: 8.1,
      ageRating: AgeRating.T18,
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      director: 'Yeon Sang-ho',
      isHot: true,
      isNowShowing: true,
      genres: ['Kinh dị', 'Hành động', 'Khoa học viễn tưởng'],
    },
    {
      title: 'Ma Tù',
      originalTitle: 'Prisoners of Ghostland',
      description: 'Một tên tội phạm khét tiếng được đưa ra khỏi tù để thực hiện một nhiệm vụ sinh tử giải cứu cô cháu gái mất tích của Thống đốc trong thế giới ngầm đầy ma quái.',
      duration: 110,
      releaseDate: new Date('2026-04-16'),
      poster: 'https://image.tmdb.org/t/p/w780/kYDCl2y0VPvhT5eYWbMRInPoB03.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/7GOW6jod9lLurW5utokAatxg7ql.jpg',
      rating: 7.2,
      ageRating: AgeRating.T18,
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      director: 'Sion Sono',
      isHot: false,
      isNowShowing: false,
      genres: ['Kinh dị', 'Hành động'],
    },
  ];

  const createdMovies = [];
  for (const m of sampleMovies) {
    const { genres, ...movieData } = m;
    let movie = await prisma.movie.findFirst({ where: { title: movieData.title } });
    if (!movie) {
      movie = await prisma.movie.create({ data: movieData });
      // Link genres
      for (const gName of genres) {
        const gId = genreMap.get(gName);
        if (gId) {
          await prisma.movieGenre.create({
            data: { movieId: movie.id, genreId: gId },
          });
        }
      }
    }
    createdMovies.push(movie);
  }

  // 5. Seed Showtimes
  console.log('5. Creating Showtimes...');
  const nowPlayingMovies = createdMovies.filter(m => m.isNowShowing);
  const showtimesData = [];

  for (let d = 0; d < 3; d++) {
    const showDate = new Date();
    showDate.setDate(showDate.getDate() + d);
    showDate.setHours(0, 0, 0, 0);

    for (const movie of nowPlayingMovies) {
      for (let rIdx = 0; rIdx < Math.min(2, allRooms.length); rIdx++) {
        const room = allRooms[rIdx];

        // Slot 1: 10:30
        const start1 = new Date(showDate);
        start1.setHours(10, 30, 0, 0);
        const end1 = new Date(start1.getTime() + (movie.duration + 15) * 60000);

        // Slot 2: 19:30
        const start2 = new Date(showDate);
        start2.setHours(19, 30, 0, 0);
        const end2 = new Date(start2.getTime() + (movie.duration + 15) * 60000);

        showtimesData.push({
          movieId: movie.id,
          roomId: room.id,
          startTime: start1,
          endTime: end1,
          format: MovieFormat.TWO_D,
          language: 'Phụ đề',
          basePrice: 90000,
        });

        showtimesData.push({
          movieId: movie.id,
          roomId: room.id,
          startTime: start2,
          endTime: end2,
          format: MovieFormat.IMAX,
          language: 'Phụ đề',
          basePrice: 130000,
        });
      }
    }
  }

  for (const st of showtimesData) {
    const existing = await prisma.showtime.findFirst({
      where: { roomId: st.roomId, startTime: st.startTime },
    });
    if (!existing) {
      await prisma.showtime.create({ data: st });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
