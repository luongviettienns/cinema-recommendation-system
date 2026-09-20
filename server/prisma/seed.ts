import { PrismaClient, Role, AgeRating, MovieFormat, SeatType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CineLight database...');

  // 1. Seed Users
  console.log('1. Creating Users...');
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cinema.vn' },
    update: { role: Role.ADMIN, isActive: true, assignedCinemaId: null },
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

  const customer2 = await prisma.user.upsert({
    where: { email: 'minh@cinema.vn' },
    update: {},
    create: {
      email: 'minh@cinema.vn',
      password: hashedPassword,
      name: 'Trần Văn Minh',
      phone: '0903456789',
      role: Role.CUSTOMER,
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
    },
  });

  const customer3 = await prisma.user.upsert({
    where: { email: 'lan@cinema.vn' },
    update: {},
    create: {
      email: 'lan@cinema.vn',
      password: hashedPassword,
      name: 'Phạm Thị Lan',
      phone: '0904567890',
      role: Role.CUSTOMER,
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log(`✅ Users: Admin (${admin.email}), Staff (${staff.email}), 3 Customers`);

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
    { name: 'Tình cảm', slug: 'tinh-cam' },
    { name: 'Giật gân', slug: 'giat-gan' },
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
  console.log(`✅ ${genresList.length} genres created`);

  // 3. Seed Cinemas, Rooms, Seat Matrices
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

  const allRooms: Array<{ id: string; cinemaId: string; cinemaName: string }> = [];

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
          data: { cinemaId: cinema.id, name: rType.name, roomType: rType.roomType, totalSeats: 80 },
        });

        // Generate 80 seats (Rows A-H, Cols 1-10)
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const seatsToCreate = [];

        for (const row of rows) {
          let seatType = SeatType.REGULAR;
          if (['E', 'F', 'G'].includes(row)) seatType = SeatType.VIP;
          if (row === 'H') seatType = SeatType.COUPLE;

          for (let col = 1; col <= 10; col++) {
            seatsToCreate.push({ roomId: room.id, seatNumber: `${row}${col}`, row, col, seatType });
          }
        }

        await prisma.seat.createMany({ data: seatsToCreate });
      }

      allRooms.push({ id: room.id, cinemaId: cinema.id, cinemaName: cinema.name });
    }
  }

  // Assign cinema to staff
  const assignedCinema = await prisma.cinema.findFirst({ where: { name: cinemasData[0].name } });
  if (!assignedCinema) throw new Error('Cinema for staff not found.');
  await prisma.user.update({
    where: { id: staff.id },
    data: { role: Role.STAFF, isActive: true, assignedCinemaId: assignedCinema.id },
  });

  console.log(`✅ ${cinemasData.length} cinemas, ${allRooms.length} rooms (80 seats each)`);

  // 4. Seed 16 Movies (matching frontend mock data + TMDb)
  console.log('4. Creating 16 Movies...');
  const sampleMovies = [
    {
      title: 'Coyote vs. Acme',
      originalTitle: 'Coyote vs. Acme',
      description: 'Sau quá nhiều lần thất bại vì những món hàng lỗi của công ty Acme, Wile E. Coyote quyết định khởi kiện tập đoàn Acme ra tòa với sự trợ giúp của một luật sư trẻ.',
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
      description: 'Sau khi một thảm họa thiên nhiên xé toạc Phố Oak khỏi khu ngoại ô, gia đình Platt phải đứng bên nhau để vượt qua vận mệnh nghiệt ngã.',
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
      description: 'Giáo sư Se Jeong tham dự hội nghị công nghệ sinh học, nhưng một virus đột biến được giải phóng biến sự kiện thành thảm họa toàn cầu.',
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
      title: 'Biệt Đội Suicide Squad 3',
      originalTitle: 'Suicide Squad: Bloodsport',
      description: 'Nhóm siêu phản diện mới nhất được triệu tập để thực hiện nhiệm vụ bất khả thi sâu trong lãnh thổ kẻ thù, đổi lại là tự do.',
      duration: 132,
      releaseDate: new Date('2026-07-30'),
      poster: 'https://image.tmdb.org/t/p/w780/kb4s0ML0iVZlG6wAKbbs9NAm6Xx.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/jlGmlFOcfo8n5tURmhC7YVd4Iyy.jpg',
      rating: 7.8,
      ageRating: AgeRating.T16,
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      director: 'James Gunn',
      isHot: true,
      isNowShowing: true,
      genres: ['Hành động', 'Hài hước', 'Phiêu lưu'],
    },
    {
      title: 'Inside Out 3',
      originalTitle: 'Inside Out 3',
      description: 'Riley bước vào tuổi 17 đầy biến động và các cảm xúc cũ phải đối mặt với những cảm xúc phức tạp mới hoàn toàn ngoài sức tưởng tượng.',
      duration: 100,
      releaseDate: new Date('2026-06-19'),
      poster: 'https://image.tmdb.org/t/p/w780/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/9h2KgGXSmWigNwkGDSxBPMQS1X4.jpg',
      rating: 8.4,
      ageRating: AgeRating.P,
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      director: 'Kelsey Mann',
      isHot: true,
      isNowShowing: true,
      genres: ['Hoạt hình', 'Gia đình', 'Hài hước'],
    },
    {
      title: 'Avatar 3: Lửa Và Tro',
      originalTitle: 'Avatar: Fire and Ash',
      description: 'Jake Sully và Neytiri đối mặt với mối đe dọa mới khi bộ tộc Ash hiếu chiến thẳng tiến về phía Pandora với vũ khí hủy diệt.',
      duration: 190,
      releaseDate: new Date('2026-12-19'),
      poster: 'https://image.tmdb.org/t/p/w780/xRd1eJIDe7JHO5KFbQdMGTqdUis.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/s16H6tpK2utvwpaEnNSzForcCe0.jpg',
      rating: 7.6,
      ageRating: AgeRating.T13,
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      director: 'James Cameron',
      isHot: true,
      isNowShowing: false,
      genres: ['Hành động', 'Khoa học viễn tưởng', 'Phiêu lưu'],
    },
    {
      title: 'Lật Mặt 8',
      originalTitle: 'Lật Mặt 8',
      description: 'Thành tiếp tục hành trình trở thành diễn viên chuyên nghiệp trong phim trường đầy áp lực và những mối quan hệ phức tạp sau hậu trường.',
      duration: 118,
      releaseDate: new Date('2026-04-30'),
      poster: 'https://image.tmdb.org/t/p/w780/aosm8NMQ3UyoBVpSxyimorCQykC.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/AmR3JfderUACCqVAKXVor3gPwzz.jpg',
      rating: 7.2,
      ageRating: AgeRating.T13,
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      director: 'Lý Hải',
      isHot: false,
      isNowShowing: true,
      genres: ['Hài hước', 'Tâm lý', 'Tình cảm'],
    },
    {
      title: 'Captain America: Thế Giới Mới',
      originalTitle: 'Captain America: Brave New World',
      description: 'Sam Wilson với danh hiệu Captain America mới đối mặt với mưu đồ toàn cầu trong một thế giới đã thay đổi hoàn toàn sau Blip.',
      duration: 118,
      releaseDate: new Date('2026-02-14'),
      poster: 'https://image.tmdb.org/t/p/w780/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/m9EtP1SH0Q5zBh8Iy0u4bMdRiHd.jpg',
      rating: 6.8,
      ageRating: AgeRating.T13,
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      director: 'Julius Onah',
      isHot: false,
      isNowShowing: true,
      genres: ['Hành động', 'Phiêu lưu', 'Khoa học viễn tưởng'],
    },
    {
      title: 'Thunderbolts*',
      originalTitle: 'Thunderbolts*',
      description: 'Nhóm các siêu anh hùng chưa được công nhận tập hợp để thực hiện nhiệm vụ không ai khác dám đảm nhận dưới danh nghĩa bí mật của chính phủ.',
      duration: 126,
      releaseDate: new Date('2026-05-02'),
      poster: 'https://image.tmdb.org/t/p/w780/m9EtP1SH0Q5zBh8Iy0u4bMdRiHd.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
      rating: 7.4,
      ageRating: AgeRating.T13,
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      director: 'Jake Schreier',
      isHot: true,
      isNowShowing: true,
      genres: ['Hành động', 'Phiêu lưu'],
    },
    {
      title: 'Sinners',
      originalTitle: 'Sinners',
      description: 'Hai anh em sinh đôi trở về quê hương miền Nam nước Mỹ để bắt đầu lại cuộc đời, nhưng lại vô tình gọi tới một thứ tồi tệ hơn nhiều từ những vùng tối.',
      duration: 137,
      releaseDate: new Date('2026-04-18'),
      poster: 'https://image.tmdb.org/t/p/w780/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/s16H6tpK2utvwpaEnNSzForcCe0.jpg',
      rating: 8.2,
      ageRating: AgeRating.T18,
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      director: 'Ryan Coogler',
      isHot: true,
      isNowShowing: true,
      genres: ['Kinh dị', 'Tâm lý', 'Giật gân'],
    },
    {
      title: 'The Alto Knights',
      originalTitle: 'The Alto Knights',
      description: 'Câu chuyện về hai tên trùm mafia Frank Costello và Vito Genovese — từng là đồng minh máu thịt — giờ đây đứng trước cuộc chiến sinh tử để kiểm soát New York.',
      duration: 124,
      releaseDate: new Date('2026-03-21'),
      poster: 'https://image.tmdb.org/t/p/w780/kb4s0ML0iVZlG6wAKbbs9NAm6Xx.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/jlGmlFOcfo8n5tURmhC7YVd4Iyy.jpg',
      rating: 7.0,
      ageRating: AgeRating.T18,
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      director: 'Barry Levinson',
      isHot: false,
      isNowShowing: true,
      genres: ['Tâm lý', 'Giật gân', 'Tình cảm'],
    },
    {
      title: 'Flow',
      originalTitle: 'Straume',
      description: 'Trong thế giới không có con người, một chú mèo nhỏ dũng cảm lên thuyền cùng các loài động vật khác để cùng nhau vượt qua trận đại hồng thủy.',
      duration: 84,
      releaseDate: new Date('2026-03-07'),
      poster: 'https://image.tmdb.org/t/p/w780/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/9h2KgGXSmWigNwkGDSxBPMQS1X4.jpg',
      rating: 8.5,
      ageRating: AgeRating.P,
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      director: 'Gints Zilbalodis',
      isHot: true,
      isNowShowing: false,
      genres: ['Hoạt hình', 'Phiêu lưu', 'Gia đình'],
    },
    {
      title: 'Warfare',
      originalTitle: 'Warfare',
      description: 'Dựa trên câu chuyện có thật từ một chiến dịch đặc nhiệm Navy SEAL tại Ramadi năm 2006, tái hiện từng phút chiến đấu không có nhạc nền, không có anh hùng hóa.',
      duration: 95,
      releaseDate: new Date('2026-04-11'),
      poster: 'https://image.tmdb.org/t/p/w780/xRd1eJIDe7JHO5KFbQdMGTqdUis.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/AmR3JfderUACCqVAKXVor3gPwzz.jpg',
      rating: 8.0,
      ageRating: AgeRating.T18,
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      director: 'Alex Garland',
      isHot: false,
      isNowShowing: false,
      genres: ['Hành động', 'Tâm lý'],
    },
    {
      title: 'Novocaine',
      originalTitle: 'Novocaine',
      description: 'Nathan đau dọn ra không cảm nhận được cơn đau vật lý, nhưng khi người phụ nữ mình yêu bị bắt cóc, anh biến khuyết điểm thành siêu năng lực đáng sợ.',
      duration: 110,
      releaseDate: new Date('2026-03-14'),
      poster: 'https://image.tmdb.org/t/p/w780/aosm8NMQ3UyoBVpSxyimorCQykC.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
      rating: 6.7,
      ageRating: AgeRating.T16,
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      director: 'Dan Berk',
      isHot: false,
      isNowShowing: false,
      genres: ['Hành động', 'Hài hước', 'Giật gân'],
    },
    {
      title: 'Paddington in Peru',
      originalTitle: 'Paddington in Peru',
      description: 'Gấu Paddington lên đường đến Peru để thăm người cô Bảo già và vô tình dấn thân vào một hành trình phiêu lưu giữa rừng Amazon huyền bí.',
      duration: 106,
      releaseDate: new Date('2026-11-08'),
      poster: 'https://image.tmdb.org/t/p/w780/mSmI2mpnAz9eo4fA3CDgqHNnIvX.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/feSKxnJbq8uFYCFnqYO6NJe0nVg.jpg',
      rating: 7.3,
      ageRating: AgeRating.P,
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      director: 'Dougal Wilson',
      isHot: false,
      isNowShowing: false,
      genres: ['Hoạt hình', 'Gia đình', 'Phiêu lưu'],
    },
    {
      title: 'Ma Tù',
      originalTitle: 'Prisoners of Ghostland',
      description: 'Một tên tội phạm khét tiếng được đưa ra khỏi tù để giải cứu cô cháu gái mất tích của Thống đốc trong thế giới ngầm đầy ma quái.',
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
      for (const gName of genres) {
        const gId = genreMap.get(gName);
        if (gId) {
          await prisma.movieGenre.create({ data: { movieId: movie.id, genreId: gId } });
        }
      }
    }
    createdMovies.push(movie);
  }
  console.log(`✅ ${createdMovies.length} movies created`);

  // 5. Seed Showtimes (7 days, 4 slots per day)
  console.log('5. Creating Showtimes (7 days, 4 slots/day)...');
  const nowPlayingMovies = createdMovies.filter((m) => m.isNowShowing);

  // 4 time slots
  const timeSlots = [
    { hours: 9, minutes: 0, format: MovieFormat.TWO_D, language: 'Phụ đề', basePrice: 90000 },
    { hours: 13, minutes: 0, format: MovieFormat.THREE_D, language: 'Phụ đề', basePrice: 110000 },
    { hours: 16, minutes: 30, format: MovieFormat.IMAX, language: 'Phụ đề', basePrice: 130000 },
    { hours: 20, minutes: 0, format: MovieFormat.TWO_D, language: 'Lồng tiếng', basePrice: 95000 },
  ];

  let showtimeCount = 0;

  for (let d = 0; d < 7; d++) {
    const showDate = new Date();
    showDate.setDate(showDate.getDate() + d);
    showDate.setHours(0, 0, 0, 0);

    for (const movie of nowPlayingMovies) {
      // Spread movies across rooms in round-robin (avoid same room collision)
      const movieIndex = nowPlayingMovies.indexOf(movie);
      const roomIndex = movieIndex % 3; // 3 rooms per cinema
      // Use rooms from different cinemas for variety
      const candidateRooms = allRooms.filter((_, idx) => idx % 3 === roomIndex).slice(0, 3);

      for (let slotIdx = 0; slotIdx < timeSlots.length; slotIdx++) {
        const slot = timeSlots[slotIdx];
        const room = candidateRooms[slotIdx % candidateRooms.length];
        if (!room) continue;

        const startTime = new Date(showDate);
        startTime.setHours(slot.hours, slot.minutes, 0, 0);
        const endTime = new Date(startTime.getTime() + (movie.duration + 15) * 60000);

        const existing = await prisma.showtime.findFirst({
          where: { roomId: room.id, startTime },
        });

        if (!existing) {
          await prisma.showtime.create({
            data: {
              movieId: movie.id,
              roomId: room.id,
              startTime,
              endTime,
              format: slot.format,
              language: slot.language,
              basePrice: slot.basePrice,
            },
          });
          showtimeCount++;
        }
      }
    }
  }
  console.log(`✅ ~${showtimeCount} showtimes created`);

  // 6. Seed sample Reviews for each movie
  console.log('6. Creating Sample Reviews...');
  const reviewTemplates = [
    { rating: 9, comment: 'Phim cực kỳ ấn tượng! Hình ảnh đẹp mắt, cốt truyện hấp dẫn từ đầu đến cuối. Xứng đáng là bộ phim hay nhất mùa hè này.' },
    { rating: 8, comment: 'Rất hay và cảm động. Diễn xuất của dàn diễn viên quá tốt, đặc biệt là cảnh cuối. Sẽ giới thiệu cho bạn bè cùng xem.' },
    { rating: 7, comment: 'Phim khá ổn, xem được. Một vài cảnh hơi dài dòng nhưng nhìn chung thú vị. Hiệu ứng hình ảnh đẹp.' },
    { rating: 9, comment: 'Tuyệt vời! Đây là loại phim hiếm khi xuất hiện. Cái kết mở gây nhiều tranh cãi nhưng tôi thích sự tinh tế đó.' },
    { rating: 6, comment: 'Phim tạm ổn, không quá xuất sắc cũng không tệ. Phù hợp để xem giải trí vào cuối tuần.' },
  ];

  const reviewers = [customer, customer2, customer3];
  let reviewCount = 0;

  for (const movie of createdMovies.slice(0, 8)) {
    for (let i = 0; i < 3; i++) {
      const reviewer = reviewers[i % reviewers.length];
      const template = reviewTemplates[i % reviewTemplates.length];

      const existing = await prisma.review.findFirst({
        where: { movieId: movie.id, userId: reviewer.id },
      });

      if (!existing) {
        await prisma.review.create({
          data: {
            movieId: movie.id,
            userId: reviewer.id,
            rating: template.rating,
            comment: template.comment,
          },
        });
        reviewCount++;
      }
    }
  }
  console.log(`✅ ${reviewCount} sample reviews created`);

  console.log('\n🎉 Seeding completed successfully!');
  console.log('-----------------------------------');
  console.log('📧 Tài khoản mẫu (password: 123456):');
  console.log('   👑 Admin: admin@cinema.vn');
  console.log('   🎟️ Staff: staff@cinema.vn');
  console.log('   👤 Demo:  demo@cinema.vn');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
