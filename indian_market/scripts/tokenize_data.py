#!/usr/bin/env python3
"""
Script to tokenize Indian stock market data using KronosTokenizer.
This script encodes OHLCV data into discrete token sequences for model training.
"""

import pandas as pd
import numpy as np
import os
import pickle
import logging
from transformers import AutoTokenizer
import torch
from sklearn.preprocessing import KBinsDiscretizer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class KronosDataTokenizer:
    """
    Custom tokenizer for financial time series data based on Kronos approach.
    """
    
    def __init__(self, n_bins=1000, vocab_size=10000):
        """
        Initialize the tokenizer.
        
        Args:
            n_bins (int): Number of bins for discretization
            vocab_size (int): Size of the vocabulary
        """
        self.n_bins = n_bins
        self.vocab_size = vocab_size
        self.discretizers = {}
        self.special_tokens = {
            'pad': 0,
            'unk': 1,
            'cls': 2,
            'sep': 3,
            'mask': 4
        }
        
    def fit(self, data, feature_columns):
        """
        Fit the tokenizer on the data.
        
        Args:
            data (pd.DataFrame): Input data
            feature_columns (list): List of feature columns to tokenize
        """
        logger.info("Fitting tokenizer on data...")
        
        for col in feature_columns:
            logger.info(f"Fitting discretizer for {col}")
            
            # Create discretizer for each feature
            discretizer = KBinsDiscretizer(
                n_bins=self.n_bins,
                encode='ordinal',
                strategy='quantile'
            )
            
            # Fit on the data
            col_data = data[col].values.reshape(-1, 1)
            discretizer.fit(col_data)
            
            # Store the discretizer
            self.discretizers[col] = discretizer
    
    def transform(self, data, feature_columns, sequence_length=512):
        """
        Transform data into token sequences.
        
        Args:
            data (pd.DataFrame): Input data
            feature_columns (list): List of feature columns to tokenize
            sequence_length (int): Length of each sequence
        
        Returns:
            list: List of token sequences
        """
        logger.info("Transforming data into token sequences...")
        
        # Group data by symbol
        token_sequences = []
        
        for symbol in data['symbol'].unique():
            symbol_data = data[data['symbol'] == symbol].copy()
            symbol_data = symbol_data.sort_values('timestamp')
            
            # Transform each feature
            feature_tokens = []
            for col in feature_columns:
                if col in self.discretizers:
                    col_data = symbol_data[col].values.reshape(-1, 1)
                    tokens = self.discretizers[col].transform(col_data).flatten()
                    # Add offset to avoid overlap with special tokens
                    tokens = tokens + len(self.special_tokens)
                    feature_tokens.append(tokens)
            
            # Combine features into multi-dimensional tokens
            # We'll use a simple approach: concatenate feature tokens
            combined_tokens = []
            for i in range(len(feature_tokens[0])):
                token = 0
                for j, feat_tokens in enumerate(feature_tokens):
                    if i < len(feat_tokens):
                        # Combine features using bit shifting
                        token = token * (self.n_bins + len(self.special_tokens)) + feat_tokens[i]
                combined_tokens.append(token)
            
            # Split into sequences
            sequences = []
            for i in range(0, len(combined_tokens), sequence_length):
                sequence = combined_tokens[i:i + sequence_length]
                if len(sequence) == sequence_length:
                    sequences.append(sequence)
            
            token_sequences.extend(sequences)
            logger.info(f"Created {len(sequences)} sequences for {symbol}")
        
        return token_sequences
    
    def save(self, filepath):
        """
        Save the tokenizer to a file.
        
        Args:
            filepath (str): Path to save the tokenizer
        """
        tokenizer_data = {
            'n_bins': self.n_bins,
            'vocab_size': self.vocab_size,
            'discretizers': self.discretizers,
            'special_tokens': self.special_tokens
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(tokenizer_data, f)
        
        logger.info(f"Tokenizer saved to {filepath}")
    
    @classmethod
    def load(cls, filepath):
        """
        Load a tokenizer from a file.
        
        Args:
            filepath (str): Path to load the tokenizer from
        
        Returns:
            KronosDataTokenizer: Loaded tokenizer
        """
        with open(filepath, 'rb') as f:
            tokenizer_data = pickle.load(f)
        
        tokenizer = cls(
            n_bins=tokenizer_data['n_bins'],
            vocab_size=tokenizer_data['vocab_size']
        )
        tokenizer.discretizers = tokenizer_data['discretizers']
        tokenizer.special_tokens = tokenizer_data['special_tokens']
        
        logger.info(f"Tokenizer loaded from {filepath}")
        return tokenizer

def load_processed_data(file_path):
    """
    Load processed OHLCV data.
    
    Args:
        file_path (str): Path to the processed data file
    
    Returns:
        pd.DataFrame: Loaded data
    """
    try:
        logger.info(f"Loading processed data from {file_path}")
        data = pd.read_csv(file_path)
        
        # Convert timestamp to datetime
        data['timestamp'] = pd.to_datetime(data['timestamp'])
        
        logger.info(f"Loaded {len(data)} records")
        return data
        
    except Exception as e:
        logger.error(f"Error loading processed data: {str(e)}")
        return None

def create_sequences_for_training(data, feature_columns, sequence_length=512, 
                                prediction_length=10, stride=256):
    """
    Create input-target sequences for training.
    
    Args:
        data (pd.DataFrame): Processed data
        feature_columns (list): List of feature columns
        sequence_length (int): Length of input sequence
        prediction_length (int): Length of prediction sequence
        stride (int): Stride between sequences
    
    Returns:
        tuple: (input_sequences, target_sequences)
    """
    logger.info("Creating training sequences...")
    
    input_sequences = []
    target_sequences = []
    
    # Group by symbol
    for symbol in data['symbol'].unique():
        symbol_data = data[data['symbol'] == symbol].copy()
        symbol_data = symbol_data.sort_values('timestamp')
        
        # Extract features
        features = symbol_data[feature_columns].values
        
        # Create sequences with sliding window
        for i in range(0, len(features) - sequence_length - prediction_length, stride):
            # Input sequence
            input_seq = features[i:i + sequence_length]
            
            # Target sequence (next prediction_length steps)
            target_seq = features[i + sequence_length:i + sequence_length + prediction_length]
            
            input_sequences.append(input_seq)
            target_sequences.append(target_seq)
    
    logger.info(f"Created {len(input_sequences)} training sequences")
    return np.array(input_sequences), np.array(target_sequences)

def save_tokenized_data(input_sequences, target_sequences, output_dir):
    """
    Save tokenized data for training.
    
    Args:
        input_sequences (np.ndarray): Input sequences
        target_sequences (np.ndarray): Target sequences
        output_dir (str): Output directory
    """
    logger.info("Saving tokenized data...")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Save sequences
    data_file = os.path.join(output_dir, 'tokenized_data.pkl')
    with open(data_file, 'wb') as f:
        pickle.dump({
            'input_sequences': input_sequences,
            'target_sequences': target_sequences
        }, f)
    
    logger.info(f"Saved tokenized data to {data_file}")
    
    # Save data info
    info_file = os.path.join(output_dir, 'tokenized_data_info.txt')
    with open(info_file, 'w') as f:
        f.write(f"Tokenized Data Info\n")
        f.write(f"==================\n")
        f.write(f"Input sequences shape: {input_sequences.shape}\n")
        f.write(f"Target sequences shape: {target_sequences.shape}\n")
        f.write(f"Number of training samples: {len(input_sequences)}\n")
        f.write(f"Sequence length: {input_sequences.shape[1]}\n")
        f.write(f"Prediction length: {target_sequences.shape[1]}\n")
        f.write(f"Number of features: {input_sequences.shape[2]}\n")
    
    logger.info(f"Saved data info to {info_file}")

def main():
    """
    Main function to tokenize the data.
    """
    # Input and output directories
    input_file = '/home/z/my-project/indian_market/datasets/processed/ohlcv_data.csv'
    output_dir = '/home/z/my-project/indian_market/datasets/processed'
    
    # Load processed data
    data = load_processed_data(input_file)
    if data is None:
        logger.error("Failed to load processed data")
        return
    
    # Define feature columns
    feature_columns = [
        'open', 'high', 'low', 'close', 'volume',
        'sma_5', 'sma_20', 'ema_12', 'ema_26', 'rsi',
        'macd', 'macd_signal', 'macd_histogram',
        'bb_middle', 'bb_upper', 'bb_lower'
    ]
    
    # Filter available columns
    available_columns = [col for col in feature_columns if col in data.columns]
    logger.info(f"Using features: {available_columns}")
    
    # Initialize and fit tokenizer
    tokenizer = KronosDataTokenizer(n_bins=1000, vocab_size=10000)
    tokenizer.fit(data, available_columns)
    
    # Save tokenizer
    tokenizer_file = os.path.join(output_dir, 'kronos_tokenizer.pkl')
    tokenizer.save(tokenizer_file)
    
    # Create training sequences
    input_sequences, target_sequences = create_sequences_for_training(
        data, available_columns, 
        sequence_length=512, 
        prediction_length=10, 
        stride=256
    )
    
    # Save tokenized data
    save_tokenized_data(input_sequences, target_sequences, output_dir)
    
    logger.info("Data tokenization completed successfully!")

if __name__ == "__main__":
    main()