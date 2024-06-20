import os
import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore

# Inisialisasi Firebase
cred = credentials.Certificate("firebase-key.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Path ke file Excel
file_path = 'bookall.xlsx'  # Sesuaikan dengan path file Excel Anda

# Cek apakah file ada
if not os.path.exists(file_path):
    raise FileNotFoundError(f"File {file_path} tidak ditemukan")

# Membaca data dari file Excel
df = pd.read_excel(file_path, engine='openpyxl')  # Sesuaikan engine sesuai kebutuhan

# Nama kolom sebelum rename
print("Nama Kolom yang Ada dalam DataFrame:")
print(df.columns)

# Rename kolom 'author' menjadi 'Author'
if 'author' in df.columns:
    df.rename(columns={'author': 'Author'}, inplace=True)
else:
    missing_columns = ['Author']
    raise KeyError(f"Kolom '{', '.join(missing_columns)}' tidak ditemukan dalam DataFrame")

# Nama kolom setelah rename
print("Nama Kolom setelah rename:")
print(df.columns)

# Fungsi untuk mengunggah data buku ke Firestore
def upload_books_to_firestore(collection_name, dataframe):
    for index, row in dataframe.iterrows():
        doc_ref = db.collection(collection_name).document()
        try:
            doc_ref.set({
                'title': row['title'],
                'rating': row['rating'],
                'author': row['Author']
            })
            print(f"Data buku '{row['title']}' berhasil diunggah")
        except Exception as e:
            print(f"Error uploading book '{row['title']}': {e}")

# Unggah data buku ke koleksi 'books'
upload_books_to_firestore('books', df)

print("Proses unggah data buku selesai")
