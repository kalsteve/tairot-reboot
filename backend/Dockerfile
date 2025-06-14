# Node.js 베이스 이미지 사용
FROM node:latest

# 작업 디렉토리 생성 및 설정
WORKDIR /usr/src/app

# package.json 및 package-lock.json (있을 경우) 복사
COPY package*.json ./

# npm을 이용하여 의존성 설치 
# package.json에 명시된 모든 패키지를 자동으로 설치
RUN npm install

# 소스 코드 복사
# .dockerignore 제외
COPY . .

# 앱이 3000 포트에서 실행되도록 설정
EXPOSE 3000

# 애플리케이션 실행
CMD ["node", "app.js"]
