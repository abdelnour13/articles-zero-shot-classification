import os

BATCH_SIZE : int = 16 # Batch Size to be used
JOB_UPDATE_RATE : int = 10 # Update The Job Each N Batch.
CHUNK_SIZE : int = 1000 # Minimum chunk size, each chunk gets its own file.
MODEL_NAME : str = "MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7" # "facebook/bart-large-mnli" # The model to be used
PUBLIC_DIR : str = os.path.join("public")
RESULTS_DIR :str = os.path.join("public","results") # The directory where to save the results