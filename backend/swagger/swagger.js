const swaggerAutogen = require("swagger-autogen")();
const fs = require('fs');
const { app, server } = require('../app');

const doc = {
  info: {
    title: "Tarot API Test",
    description: "오늘도 화이팅",
  },
  /**
   * 테스트할 때는 localhost:3000을 해야 CORS가 안뜸!
   * push할 때는 host: 3001로 해주삼 !
   * (주의) main 배포는...3000으로 해야하나... 여기까지 알아보기는 마음이 지금 아픔
   */
  host: "tairot.yukey.site",
  //host: "43.202.208.226:3001",
  //host: "tairot.online",
  schemes: ["http"],
  securityDefinitions: {
    Bearer: {
      type: "apiKey",
      in: "header",
      name: "authorization",
      description: "JWT Access Token 입력 : 'Bearer {token}'",
    },
  },
};

const outputFile = "./swagger/swagger_output.json";
const endpointsFiles = ["../app.js"]; // Express 앱의 엔트리 포인트를 지정

// x-forwarded-for & x-real-ip 불필요한 헤더를 제거하는 함수
function removeUnwantedHeaders(callback) {
  fs.readFile(outputFile, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading Swagger JSON: ${err}`);
      return;
    }

    let doc = JSON.parse(data);

    for (let path in doc.paths) {
      for (let method in doc.paths[path]) {
        let parameters = doc.paths[path][method].parameters || [];
        doc.paths[path][method].parameters = parameters.filter(param => {
          return param.name !== 'x-forwarded-for' && param.name !== 'x-real-ip';
        });
      }
    }

    fs.writeFile(outputFile, JSON.stringify(doc, null, 2), 'utf8', (err) => {
      if (err) {
        console.error(`Error writing Swagger JSON: ${err}`);
      } else {
        callback(); // 수정된 파일을 쓴 후 콜백 함수를 호출하여 서버를 시작
      }
    });
  });
}

// 문서 업데이트 및 자동실행 명령어 : node ./swagger/swagger.js
// sawgger url : http://43.202.208.226:3000/api-docs/
// sawgger url : http://localhost:3000/api-docs/
swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  removeUnwantedHeaders(() => {
    // 서버 시작 로직 제거
    console.log("Swagger 문서가 생성되었습니다.");
  });
});