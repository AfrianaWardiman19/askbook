# Menggunakan image Node.js resmi
FROM node:16

# Membuat dan menggunakan direktori kerja
WORKDIR /usr/src/app

# Menyalin package.json dan package-lock.json ke direktori kerja
COPY package*.json ./

# Install dependencies
RUN npm install

# Menyalin seluruh kode aplikasi ke dalam kontainer
COPY . .

# Mengungkapkan port aplikasi
EXPOSE 3000

# Menjalankan aplikasi
CMD ["node", "index.js"]
