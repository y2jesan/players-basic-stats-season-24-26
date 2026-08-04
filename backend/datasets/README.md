# backend/datasets/

Drop real data files here: `.csv`, `.xlsx`, or `.db`/`.sqlite`/`.sqlite3`. Read them from
`backend/app/dataset_loader.py`'s `load_csv`/`load_excel`/`load_sqlite` functions, called from
`backend/app/sample_data.py` — see the root `README.md`'s "How do I plug in real data" section.

Everything in this folder except this file is gitignored, since real data usually shouldn't be
committed to version control.
