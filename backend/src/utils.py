import pandas as pd
import csv
import codecs
from fastapi import UploadFile

def get_df_from_csv(csv_file : UploadFile) -> pd.DataFrame:
    """
        Read a CSV file and return a pandas DataFrame
    """

    reader = csv.reader(codecs.iterdecode(csv_file.file, 'utf-8'))

    data = {}
    columns = None

    for i, row in enumerate(reader):
        
        if i == 0:

            columns = row

            for column in row:
                data[column] = []

        else:

            for j, column in enumerate(row):
                data[columns[j]].append(column)

    return pd.DataFrame(data)