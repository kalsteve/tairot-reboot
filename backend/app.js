require("dotenv").config(); // 혹은 절대경로로
const express = require("express");
const http = require("http"); // 소켓 io 필요 모듈
const socketIo = require("socket.io"); // 소켓 io 필요 모듈
const cors = require("cors");
const db = require("./mysql/database");
const gpt = require("./chatgpt/api");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger/swagger_output.json");
const s3 = require("./aws/awsS3");
const verifyToken = require("./middleware/verifyToken");
const socketConnection = require("./middleware/socketConnection");
const { socketSendHandler } = require("./middleware/socketHandle");
const checkPoll = require("./middleware/checkPoll");
const AppConfig = require("./appConfig");
const app = express();
const fs = require('fs');
const path = require('path');

// ELK 관련 npm
const morgan = require("morgan");
const logger = require("logger");
const logsDir = path.join(__dirname, 'logs');

// 'logs' 디렉토리가 존재하지 않으면 생성
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });

// 사용자 정의 토큰 'real-ip' 정의
morgan.token('real-ip', function(req, res) {
  const realIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log('Real IP:', realIp);
  return realIp;
});

// Morgan 로거 설정
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :real-ip', { stream: accessLogStream }));

// Express 미들웨어 설정
app.use(express.json());
const server = http.createServer(app); // http 서버 생성
const io = socketIo(server, {
  // socket.io 서버 생성
  cors: {
    origin: "*", // 모든 오리진 허용
    credentials: true, // 쿠키 허용
  },
}); // socket.io와 서버 연결
app.use(express.urlencoded({ extended: false }));
// 소켓 이벤트 설정
io.use(socketConnection.clientAuthor);
io.use(socketConnection.newClientHandler);
io.on("connection", (socket) => {
  socketConnection.clientConnectedHandler(socket);
});
app.set("io", io); // app 객체에 io 객체를 저장
const corsOptions = {
  origin: "*", // 모든 오리진 허용
  credentials: true,
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
};
app.use(cors(corsOptions));
// OPTIONS 요청 처리를 위한 미들웨어
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, DELETE"
    );
    return res.status(200).json({});
  }
  next();
});
// Swagger UI 설정
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 클라이언트의 실제 IP 주소를 추출하는 미들웨어 1
app.use((req, res, next) => {
  const realIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for'];
  console.log('Client IP:', realIp);
  next();
});

// // 클라이언트의 실제 IP 주소를 추출하는 미들웨어 2
// app.use((req, res, next) => {
//   const xForwardedFor = (req.headers['x-forwarded-for'] || '').split(',').pop().trim();
//   const realIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for'].split(',')[0].trim();
//   req.realIp = req.headers['x-real-ip'] || xForwardedFor || req.connection.remoteAddress;
//   next();
// });

// 라우팅 설정
app.use("/api/v1/tarot", require("./routes/tarot"));
app.use("/api/v1/share", require("./routes/share"));
app.use("/api/v1/polls", verifyToken, require("./routes/polls"));
app.use("/api/v1/users", require("./routes/users"));
// 공통 응답 미들웨어
app.use(require("./middleware/commonResponse"));
// 404 핸들러
app.use((req, res, next) => {
  res.status(404).json({ message: "Page Not found." });
});
// 오류 처리 미들웨어
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "서버 내부 오류" });
});


// 서버 시작 함수
async function startServer() {
  try {
    const dbConfig = {
      host: process.env.MYSQL_HOST_URL,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB_NAME,
    }
    db.initializeConnection(dbConfig);
    // gpt api 연결
    gpt.initializeGpt(process.env.OPENAI_KEY);
    // s3 연결
    s3.initializeS3();
    // appConfig 객체 저장
    app.set("appConfig", new AppConfig());
    // 서버 시작
    const port = 3100;
    // 기존 app.listen() 대신 server.listen()을 사용
    // HTTP 서버와 소켓 서버가 모두 동일한 포트로 설정
    server.listen(port, () =>
      console.log(`서버와 소켓이 포트 ${port}에서 실행 중입니다.`)
    );
  } catch (error) {
    console.error("시작 중 오류 발생:", error);
  }
}
startServer();

module.exports = { app, server };
