#!/usr/bin/env python3
"""
CLI interface for Kronos-India model predictions.
This script provides a command-line interface for making predictions with the fine-tuned model.
"""

import argparse
import os
import sys
import json
import torch
import numpy as np
import pandas as pd
import pickle
import logging
from datetime import datetime, timedelta
import yfinance as yf

# Add Kronos to path
sys.path.append('/home/z/my-project/Kronos')

from model.kronos import Kronos

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class KronosCLI:
    """
    Command-line interface for Kronos-India predictions.
    """
    
    def __init__(self, model_path, tokenizer_path, scalers_path):
        """
        Initialize the CLI.
        
        Args:
            model_path (str): Path to the fine-tuned model
            tokenizer_path (str): Path to the tokenizer
            scalers_path (str): Path to the scalers
        """
        self.model_path = model_path
        self.tokenizer_path = tokenizer_path
        self.scalers_path = scalers_path
        self.model = None
        self.tokenizer = None
        self.scalers = None
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        logger.info(f"Using device: {self.device}")
    
    def load_model(self):
        """
        Load the fine-tuned model.
        """
        try:
            logger.info(f"Loading model from {self.model_path}")
            
            checkpoint = torch.load(self.model_path, map_location=self.device)
            self.model = Kronos()
            self.model.load_state_dict(checkpoint['model_state_dict'])
            self.model.to(self.device)
            self.model.eval()
            
            logger.info("Model loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    
    def load_tokenizer(self):
        """
        Load the tokenizer.
        """
        try:
            logger.info(f"Loading tokenizer from {self.tokenizer_path}")
            
            with open(self.tokenizer_path, 'rb') as f:
                self.tokenizer = pickle.load(f)
            
            logger.info("Tokenizer loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading tokenizer: {str(e)}")
            raise
    
    def load_scalers(self):
        """
        Load the scalers.
        """
        try:
            logger.info(f"Loading scalers from {self.scalers_path}")
            
            with open(self.scalers_path, 'rb') as f:
                self.scalers = pickle.load(f)
            
            logger.info("Scalers loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading scalers: {str(e)}")
            raise
    
    def download_stock_data(self, symbol, period='1y'):
        """
        Download stock data using yfinance.
        
        Args:
            symbol (str): Stock symbol
            period (str): Period to download (e.g., '1y', '6mo', '3mo')
        
        Returns:
            pd.DataFrame: Downloaded data
        """
        try:
            logger.info(f"Downloading data for {symbol} (period: {period})")
            
            stock = yf.Ticker(symbol)
            data = stock.history(period=period)
            
            if data.empty:
                raise ValueError(f"No data found for {symbol}")
            
            # Reset index and rename columns
            data = data.reset_index()
            data = data.rename(columns={
                'Date': 'timestamp',
                'Open': 'open',
                'High': 'high',
                'Low': 'low',
                'Close': 'close',
                'Volume': 'volume'
            })
            
            # Convert timestamp to datetime
            data['timestamp'] = pd.to_datetime(data['timestamp'])
            
            # Add symbol column
            data['symbol'] = symbol
            
            logger.info(f"Downloaded {len(data)} records for {symbol}")
            return data
            
        except Exception as e:
            logger.error(f"Error downloading data for {symbol}: {str(e)}")
            raise
    
    def prepare_data_for_prediction(self, data, sequence_length=512):
        """
        Prepare data for prediction.
        
        Args:
            data (pd.DataFrame): Input data
            sequence_length (int): Length of input sequence
        
        Returns:
            torch.Tensor: Prepared input sequence
        """
        # Sort by timestamp
        data = data.sort_values('timestamp')
        
        # Get the last sequence_length records
        if len(data) < sequence_length:
            logger.warning(f"Not enough data. Using {len(data)} records instead of {sequence_length}")
            sequence_length = len(data)
        
        recent_data = data.tail(sequence_length)
        
        # Extract features
        feature_columns = [
            'open', 'high', 'low', 'close', 'volume',
            'sma_5', 'sma_20', 'ema_12', 'ema_26', 'rsi',
            'macd', 'macd_signal', 'macd_histogram',
            'bb_middle', 'bb_upper', 'bb_lower'
        ]
        
        # Calculate technical indicators if not present
        if 'sma_5' not in recent_data.columns:
            recent_data = self.calculate_technical_indicators(recent_data)
        
        # Filter available columns
        available_columns = [col for col in feature_columns if col in recent_data.columns]
        
        # Normalize data using scalers
        if self.scalers and recent_data['symbol'].iloc[0] in self.scalers:
            symbol_scalers = self.scalers[recent_data['symbol'].iloc[0]]
            for col in available_columns:
                if col in symbol_scalers:
                    recent_data[col] = symbol_scalers[col].transform(recent_data[[col]])
        
        # Create input sequence
        input_sequence = recent_data[available_columns].values
        
        # Convert to tensor
        input_tensor = torch.FloatTensor(input_sequence).unsqueeze(0)
        input_tensor = input_tensor.to(self.device)
        
        return input_tensor, recent_data
    
    def calculate_technical_indicators(self, data):
        """
        Calculate technical indicators for the data.
        
        Args:
            data (pd.DataFrame): Input data
        
        Returns:
            pd.DataFrame: Data with technical indicators
        """
        data = data.copy()
        
        # Simple Moving Averages
        data['sma_5'] = data['close'].rolling(window=5).mean()
        data['sma_20'] = data['close'].rolling(window=20).mean()
        
        # Exponential Moving Averages
        data['ema_12'] = data['close'].ewm(span=12).mean()
        data['ema_26'] = data['close'].ewm(span=26).mean()
        
        # RSI
        delta = data['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        data['rsi'] = 100 - (100 / (1 + rs))
        
        # MACD
        data['macd'] = data['ema_12'] - data['ema_26']
        data['macd_signal'] = data['macd'].ewm(span=9).mean()
        data['macd_histogram'] = data['macd'] - data['macd_signal']
        
        # Bollinger Bands
        data['bb_middle'] = data['close'].rolling(window=20).mean()
        bb_std = data['close'].rolling(window=20).std()
        data['bb_upper'] = data['bb_middle'] + (bb_std * 2)
        data['bb_lower'] = data['bb_middle'] - (bb_std * 2)
        
        # Remove rows with NaN values
        data = data.dropna()
        
        return data
    
    def predict(self, input_sequence, steps=10):
        """
        Make predictions.
        
        Args:
            input_sequence (torch.Tensor): Input sequence
            steps (int): Number of steps to predict
        
        Returns:
            np.ndarray: Predictions
        """
        with torch.no_grad():
            predictions = self.model(input_sequence, steps=steps)
        
        return predictions.cpu().numpy()
    
    def inverse_transform_predictions(self, predictions, symbol):
        """
        Inverse transform predictions to original scale.
        
        Args:
            predictions (np.ndarray): Predictions
            symbol (str): Stock symbol
        
        Returns:
            np.ndarray: Inverse transformed predictions
        """
        if not self.scalers or symbol not in self.scalers:
            logger.warning("No scalers available. Returning raw predictions.")
            return predictions
        
        # Inverse transform for 'close' price
        close_scaler = self.scalers[symbol]['close']
        
        # Extract close price predictions (index 3)
        close_predictions = predictions[:, 3]
        
        # Reshape for inverse transform
        close_predictions_reshaped = close_predictions.reshape(-1, 1)
        
        # Inverse transform
        original_scale_predictions = close_scaler.inverse_transform(close_predictions_reshaped)
        
        return original_scale_predictions.flatten()
    
    def predict_symbol(self, symbol, steps=10, sequence_length=512, download_period='1y'):
        """
        Make predictions for a specific symbol.
        
        Args:
            symbol (str): Stock symbol
            steps (int): Number of steps to predict
            sequence_length (int): Length of input sequence
            download_period (str): Period to download data
        
        Returns:
            dict: Prediction results
        """
        logger.info(f"Making predictions for {symbol} ({steps} steps)")
        
        # Download data
        data = self.download_stock_data(symbol, download_period)
        
        # Prepare data
        input_sequence, recent_data = self.prepare_data_for_prediction(data, sequence_length)
        
        # Make predictions
        predictions = self.predict(input_sequence, steps)
        
        # Inverse transform
        close_predictions = self.inverse_transform_predictions(predictions, symbol)
        
        # Create result
        result = {
            'symbol': symbol,
            'prediction_steps': steps,
            'sequence_length': sequence_length,
            'last_known_price': float(recent_data['close'].iloc[-1]),
            'predictions': close_predictions.tolist(),
            'prediction_dates': self.generate_prediction_dates(recent_data['timestamp'].iloc[-1], steps),
            'model_info': {
                'model_path': self.model_path,
                'device': self.device
            }
        }
        
        return result
    
    def generate_prediction_dates(self, last_date, steps):
        """
        Generate prediction dates.
        
        Args:
            last_date (datetime): Last known date
            steps (int): Number of prediction steps
        
        Returns:
            list: Prediction dates
        """
        prediction_dates = []
        current_date = last_date
        
        for i in range(steps):
            # Skip weekends (assuming stock market data)
            current_date += timedelta(days=1)
            while current_date.weekday() >= 5:  # 5=Saturday, 6=Sunday
                current_date += timedelta(days=1)
            prediction_dates.append(current_date.strftime('%Y-%m-%d'))
        
        return prediction_dates
    
    def save_predictions(self, result, output_file):
        """
        Save predictions to file.
        
        Args:
            result (dict): Prediction result
            output_file (str): Output file path
        """
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        logger.info(f"Predictions saved to {output_file}")

def main():
    """
    Main function for CLI interface.
    """
    parser = argparse.ArgumentParser(description='Kronos-India Stock Price Prediction CLI')
    
    parser.add_argument('--symbol', type=str, required=True,
                       help='Stock symbol (e.g., RELIANCE.NS, TCS.NS)')
    parser.add_argument('--steps', type=int, default=10,
                       help='Number of steps to predict (default: 10)')
    parser.add_argument('--sequence_length', type=int, default=512,
                       help='Length of input sequence (default: 512)')
    parser.add_argument('--period', type=str, default='1y',
                       help='Period to download data (e.g., 1y, 6mo, 3mo) (default: 1y)')
    parser.add_argument('--output', type=str,
                       help='Output file path (optional)')
    parser.add_argument('--model_path', type=str,
                       default='/home/z/my-project/indian_market/checkpoints/fine_tuned/Kronos-India-small_best.pth',
                       help='Path to the fine-tuned model')
    parser.add_argument('--tokenizer_path', type=str,
                       default='/home/z/my-project/indian_market/datasets/processed/kronos_tokenizer.pkl',
                       help='Path to the tokenizer')
    parser.add_argument('--scalers_path', type=str,
                       default='/home/z/my-project/indian_market/datasets/processed/scalers.pkl',
                       help='Path to the scalers')
    
    args = parser.parse_args()
    
    try:
        # Initialize CLI
        cli = KronosCLI(
            model_path=args.model_path,
            tokenizer_path=args.tokenizer_path,
            scalers_path=args.scalers_path
        )
        
        # Load model and components
        cli.load_model()
        cli.load_tokenizer()
        cli.load_scalers()
        
        # Make predictions
        result = cli.predict_symbol(
            symbol=args.symbol,
            steps=args.steps,
            sequence_length=args.sequence_length,
            download_period=args.period
        )
        
        # Print results
        print("\n" + "="*50)
        print("KRONOS-INDIA PREDICTION RESULTS")
        print("="*50)
        print(f"Symbol: {result['symbol']}")
        print(f"Last Known Price: {result['last_known_price']:.2f}")
        print(f"Prediction Steps: {result['prediction_steps']}")
        print("\nPredictions:")
        print("-"*30)
        for i, (date, pred) in enumerate(zip(result['prediction_dates'], result['predictions'])):
            print(f"Day {i+1} ({date}): {pred:.2f}")
        
        # Save to file if specified
        if args.output:
            cli.save_predictions(result, args.output)
            print(f"\nResults saved to: {args.output}")
        
        print("\n" + "="*50)
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()