#!/usr/bin/env python3
"""
Script to clean and normalize Indian stock market data into Kronos format.
This script processes raw OHLCV data and prepares it for tokenization.
"""

import pandas as pd
import numpy as np
import os
import logging
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import pickle

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def load_raw_data(file_path):
    """
    Load raw OHLCV data from CSV file.
    
    Args:
        file_path (str): Path to the CSV file
    
    Returns:
        pd.DataFrame: Loaded data
    """
    try:
        logger.info(f"Loading raw data from {file_path}")
        data = pd.read_csv(file_path)
        
        # Convert timestamp to datetime
        data['timestamp'] = pd.to_datetime(data['timestamp'])
        
        logger.info(f"Loaded {len(data)} records")
        return data
        
    except Exception as e:
        logger.error(f"Error loading data from {file_path}: {str(e)}")
        return None

def clean_data(data):
    """
    Clean the OHLCV data by removing outliers and handling missing values.
    
    Args:
        data (pd.DataFrame): Raw OHLCV data
    
    Returns:
        pd.DataFrame: Cleaned data
    """
    logger.info("Cleaning data...")
    
    # Remove rows with missing values
    initial_count = len(data)
    data = data.dropna()
    logger.info(f"Removed {initial_count - len(data)} rows with missing values")
    
    # Remove outliers using IQR method for each symbol
    cleaned_data = []
    
    for symbol in data['symbol'].unique():
        symbol_data = data[data['symbol'] == symbol].copy()
        
        # Calculate IQR for price columns
        price_columns = ['open', 'high', 'low', 'close']
        for col in price_columns:
            Q1 = symbol_data[col].quantile(0.25)
            Q3 = symbol_data[col].quantile(0.75)
            IQR = Q3 - Q1
            
            # Define outlier bounds
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            # Remove outliers
            symbol_data = symbol_data[
                (symbol_data[col] >= lower_bound) & 
                (symbol_data[col] <= upper_bound)
            ]
        
        # Volume outlier detection (more conservative)
        Q1_vol = symbol_data['volume'].quantile(0.25)
        Q3_vol = symbol_data['volume'].quantile(0.75)
        IQR_vol = Q3_vol - Q1_vol
        
        lower_bound_vol = Q1_vol - 3 * IQR_vol  # More conservative for volume
        upper_bound_vol = Q3_vol + 3 * IQR_vol
        
        symbol_data = symbol_data[
            (symbol_data['volume'] >= max(0, lower_bound_vol)) & 
            (symbol_data['volume'] <= upper_bound_vol)
        ]
        
        cleaned_data.append(symbol_data)
    
    if cleaned_data:
        cleaned_df = pd.concat(cleaned_data, ignore_index=True)
        logger.info(f"Cleaned data: {len(cleaned_df)} records remaining")
        return cleaned_df
    else:
        logger.error("No data remaining after cleaning")
        return None

def normalize_data(data, method='standard'):
    """
    Normalize the OHLCV data.
    
    Args:
        data (pd.DataFrame): Cleaned data
        method (str): Normalization method ('standard' or 'minmax')
    
    Returns:
        tuple: (normalized_data, scalers)
    """
    logger.info(f"Normalizing data using {method} method...")
    
    # Separate features to normalize
    feature_columns = ['open', 'high', 'low', 'close', 'volume']
    
    # Create a copy of the data
    normalized_data = data.copy()
    
    # Initialize scalers dictionary
    scalers = {}
    
    # Normalize each symbol separately
    for symbol in data['symbol'].unique():
        symbol_data = data[data['symbol'] == symbol]
        symbol_scalers = {}
        
        for col in feature_columns:
            if method == 'standard':
                scaler = StandardScaler()
            else:  # minmax
                scaler = MinMaxScaler()
            
            # Fit and transform the data
            normalized_values = scaler.fit_transform(symbol_data[[col]])
            
            # Update the normalized data
            normalized_data.loc[symbol_data.index, col] = normalized_values.flatten()
            
            # Store the scaler
            symbol_scalers[col] = scaler
        
        scalers[symbol] = symbol_scalers
    
    logger.info("Data normalization completed")
    return normalized_data, scalers

def add_technical_indicators(data):
    """
    Add technical indicators to the data for better features.
    
    Args:
        data (pd.DataFrame): Normalized data
    
    Returns:
        pd.DataFrame: Data with technical indicators
    """
    logger.info("Adding technical indicators...")
    
    # Create a copy to avoid modifying original data
    enhanced_data = data.copy()
    
    # Calculate technical indicators for each symbol
    for symbol in data['symbol'].unique():
        symbol_data = data[data['symbol'] == symbol].copy()
        
        # Sort by timestamp
        symbol_data = symbol_data.sort_values('timestamp')
        
        # Simple Moving Averages
        symbol_data['sma_5'] = symbol_data['close'].rolling(window=5).mean()
        symbol_data['sma_20'] = symbol_data['close'].rolling(window=20).mean()
        
        # Exponential Moving Averages
        symbol_data['ema_12'] = symbol_data['close'].ewm(span=12).mean()
        symbol_data['ema_26'] = symbol_data['close'].ewm(span=26).mean()
        
        # RSI (Relative Strength Index)
        delta = symbol_data['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        symbol_data['rsi'] = 100 - (100 / (1 + rs))
        
        # MACD
        symbol_data['macd'] = symbol_data['ema_12'] - symbol_data['ema_26']
        symbol_data['macd_signal'] = symbol_data['macd'].ewm(span=9).mean()
        symbol_data['macd_histogram'] = symbol_data['macd'] - symbol_data['macd_signal']
        
        # Bollinger Bands
        symbol_data['bb_middle'] = symbol_data['close'].rolling(window=20).mean()
        bb_std = symbol_data['close'].rolling(window=20).std()
        symbol_data['bb_upper'] = symbol_data['bb_middle'] + (bb_std * 2)
        symbol_data['bb_lower'] = symbol_data['bb_middle'] - (bb_std * 2)
        
        # Update the enhanced data
        for col in ['sma_5', 'sma_20', 'ema_12', 'ema_26', 'rsi', 'macd', 'macd_signal', 
                   'macd_histogram', 'bb_middle', 'bb_upper', 'bb_lower']:
            enhanced_data.loc[symbol_data.index, col] = symbol_data[col]
    
    # Remove rows with NaN values (due to rolling calculations)
    initial_count = len(enhanced_data)
    enhanced_data = enhanced_data.dropna()
    logger.info(f"Added technical indicators, removed {initial_count - len(enhanced_data)} rows with NaN values")
    
    return enhanced_data

def save_processed_data(data, scalers, output_dir):
    """
    Save processed data and scalers.
    
    Args:
        data (pd.DataFrame): Processed data
        scalers (dict): Fitted scalers
        output_dir (str): Output directory path
    """
    logger.info("Saving processed data...")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Save processed data
    data_file = os.path.join(output_dir, 'ohlcv_data.csv')
    data.to_csv(data_file, index=False)
    logger.info(f"Saved processed data to {data_file}")
    
    # Save scalers
    scalers_file = os.path.join(output_dir, 'scalers.pkl')
    with open(scalers_file, 'wb') as f:
        pickle.dump(scalers, f)
    logger.info(f"Saved scalers to {scalers_file}")
    
    # Save data summary
    summary_file = os.path.join(output_dir, 'data_summary.txt')
    with open(summary_file, 'w') as f:
        f.write(f"Data Summary\n")
        f.write(f"============\n")
        f.write(f"Total records: {len(data)}\n")
        f.write(f"Date range: {data['timestamp'].min()} to {data['timestamp'].max()}\n")
        f.write(f"Unique symbols: {data['symbol'].nunique()}\n")
        f.write(f"Columns: {list(data.columns)}\n\n")
        
        f.write("Symbol-wise summary:\n")
        f.write("-------------------\n")
        for symbol in data['symbol'].unique():
            symbol_data = data[data['symbol'] == symbol]
            f.write(f"{symbol}: {len(symbol_data)} records\n")
    
    logger.info(f"Saved data summary to {summary_file}")

def main():
    """
    Main function to clean and normalize the data.
    """
    # Input and output directories
    input_file = '/home/z/my-project/indian_market/datasets/raw/nse_stocks_combined.csv'
    output_dir = '/home/z/my-project/indian_market/datasets/processed'
    
    # Load raw data
    data = load_raw_data(input_file)
    if data is None:
        logger.error("Failed to load raw data")
        return
    
    # Clean data
    cleaned_data = clean_data(data)
    if cleaned_data is None:
        logger.error("Failed to clean data")
        return
    
    # Normalize data
    normalized_data, scalers = normalize_data(cleaned_data, method='standard')
    
    # Add technical indicators
    enhanced_data = add_technical_indicators(normalized_data)
    
    # Save processed data
    save_processed_data(enhanced_data, scalers, output_dir)
    
    logger.info("Data cleaning and normalization completed successfully!")

if __name__ == "__main__":
    main()