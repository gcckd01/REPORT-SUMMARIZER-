import nltk
import numpy as np
from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from transformers import pipeline, BartTokenizer, BartForConditionalGeneration
import logging
import os

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Download necessary NLTK resources
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
except Exception as e:
    logger.error(f"Failed to download NLTK resources: {e}")

class ReportSummarizer:
    def __init__(self, method='extractive', model_name=None, max_length=150, min_length=40):
        """
        Initialize the report summarizer.
        
        Args:
            method (str): Summarization method ('extractive' or 'abstractive')
            model_name (str, optional): Pretrained model name for abstractive summarization
            max_length (int): Maximum length of the generated summary
            min_length (int): Minimum length of the generated summary
        """
        self.method = method
        self.max_length = max_length
        self.min_length = min_length
        
        if self.method == 'abstractive':
            if not model_name:
                model_name = 'facebook/bart-large-cnn'
            
            try:
                logger.info(f"Loading abstractive model: {model_name}")
                self.tokenizer = BartTokenizer.from_pretrained(model_name)
                self.model = BartForConditionalGeneration.from_pretrained(model_name)
                self.summarizer = pipeline("summarization", model=self.model, tokenizer=self.tokenizer)
            except Exception as e:
                logger.error(f"Failed to load abstractive model: {e}")
                logger.info("Falling back to extractive summarization")
                self.method = 'extractive'
        
        if self.method == 'extractive':
            logger.info("Using extractive summarization")
            self.stop_words = set(stopwords.words('english'))
            self.vectorizer = TfidfVectorizer(stop_words='english')
    
    def preprocess_text(self, text):
        """
        Preprocess text by cleaning and tokenizing.
        
        Args:
            text (str): Input text to be preprocessed
            
        Returns:
            list: List of sentences
        """
        # Basic cleaning
        text = text.strip()
        
        # Tokenize into sentences
        sentences = sent_tokenize(text)
        
        return sentences
    
    def extractive_summarize(self, text):
        """
        Generate an extractive summary using TF-IDF ranking.
        
        Args:
            text (str): Input text to summarize
            
        Returns:
            str: Extractive summary
        """
        sentences = self.preprocess_text(text)
        
        if len(sentences) <= 3:
            return text
        
        # Create sentence vectors
        tfidf_matrix = self.vectorizer.fit_transform(sentences)
        
        # Calculate sentence scores based on TF-IDF values
        sentence_scores = np.array([tfidf_matrix[i].sum() for i in range(len(sentences))])
        
        # Determine number of sentences for summary (approximately 1/3 of original)
        num_sentences = max(min(int(len(sentences) / 3), 10), 3)
        
        # Get indices of top sentences
        top_indices = sentence_scores.argsort()[-num_sentences:]
        top_indices = sorted(top_indices)
        
        # Construct summary
        summary = ' '.join([sentences[i] for i in top_indices])
        
        return summary
    
    def abstractive_summarize(self, text):
        """
        Generate an abstractive summary using pretrained transformer model.
        
        Args:
            text (str): Input text to summarize
            
        Returns:
            str: Abstractive summary
        """
        try:
            summary = self.summarizer(text, 
                                      max_length=self.max_length, 
                                      min_length=self.min_length, 
                                      do_sample=False)[0]['summary_text']
            return summary
        except Exception as e:
            logger.error(f"Abstractive summarization failed: {e}")
            logger.info("Falling back to extractive summarization")
            return self.extractive_summarize(text)
    
    def summarize(self, text):
        """
        Generate a summary based on the selected method.
        
        Args:
            text (str): Input text to summarize
            
        Returns:
            str: Generated summary
        """
        if not text or len(text.strip()) == 0:
            return ""
        
        if self.method == 'abstractive':
            return self.abstractive_summarize(text)
        else:
            return self.extractive_summarize(text)
    
    def summarize_file(self, file_path):
        """
        Read a file and generate a summary.
        
        Args:
            file_path (str): Path to the input file
            
        Returns:
            str: Generated summary
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            return self.summarize(text)
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}")
            return ""