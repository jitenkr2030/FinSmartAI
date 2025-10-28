#!/usr/bin/env python3
"""
Script to make predictions and evaluate the fine-tuned Kronos model.
This script loads the fine-tuned model and makes predictions on test data.
"""

import os
import sys
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
import pickle
import logging
import json
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from tqdm import tqdm

# Add Kronos to path
sys.path.append('/home/z/my-project/Kronos')

from model.kronos import Kronos

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class KronosPredictor:
    """
    Prediction class for fine-tuned Kronos model.
    """
    
    def __init__(self, model_path, device='cuda' if torch.cuda.is_available() else 'cpu'):
        """
        Initialize the predictor.
        
        Args:
            model_path (str): Path to the fine-tuned model
            device (str): Device to use for prediction
        """
        self.model_path = model_path
        self.device = device
        self.model = None
        self.tokenizer = None
        self.scalers = None
        
        logger.info(f"Using device: {self.device}")
    
    def load_model(self):
        """
        Load the fine-tuned model.
        """
        try:
            logger.info(f"Loading fine-tuned model from {self.model_path}")
            
            # Load checkpoint
            checkpoint = torch.load(self.model_path, map_location=self.device)
            
            # Initialize model
            self.model = Kronos()
            self.model.load_state_dict(checkpoint['model_state_dict'])
            self.model.to(self.device)
            self.model.eval()
            
            logger.info("Model loaded successfully")
            logger.info(f"Model was trained for {checkpoint['epoch']} epochs")
            logger.info(f"Best validation loss: {checkpoint.get('val_loss', 'N/A')}")
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    
    def load_tokenizer(self, tokenizer_path):
        """
        Load the tokenizer.
        
        Args:
            tokenizer_path (str): Path to the tokenizer file
        """
        try:
            logger.info(f"Loading tokenizer from {tokenizer_path}")
            
            with open(tokenizer_path, 'rb') as f:
                self.tokenizer = pickle.load(f)
            
            logger.info("Tokenizer loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading tokenizer: {str(e)}")
            raise
    
    def load_scalers(self, scalers_path):
        """
        Load the data scalers.
        
        Args:
            scalers_path (str): Path to the scalers file
        """
        try:
            logger.info(f"Loading scalers from {scalers_path}")
            
            with open(scalers_path, 'rb') as f:
                self.scalers = pickle.load(f)
            
            logger.info("Scalers loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading scalers: {str(e)}")
            raise
    
    def prepare_input_sequence(self, data, symbol, sequence_length=512):
        """
        Prepare input sequence for prediction.
        
        Args:
            data (pd.DataFrame): Input data
            symbol (str): Stock symbol
            sequence_length (int): Length of input sequence
        
        Returns:
            torch.Tensor: Prepared input sequence
        """
        # Filter data for the symbol
        symbol_data = data[data['symbol'] == symbol].copy()
        symbol_data = symbol_data.sort_values('timestamp')
        
        # Get the last sequence_length records
        if len(symbol_data) < sequence_length:
            logger.warning(f"Not enough data for {symbol}. Using {len(symbol_data)} records.")
            sequence_length = len(symbol_data)
        
        recent_data = symbol_data.tail(sequence_length)
        
        # Extract features
        feature_columns = [
            'open', 'high', 'low', 'close', 'volume',
            'sma_5', 'sma_20', 'ema_12', 'ema_26', 'rsi',
            'macd', 'macd_signal', 'macd_histogram',
            'bb_middle', 'bb_upper', 'bb_lower'
        ]
        
        # Filter available columns
        available_columns = [col for col in feature_columns if col in recent_data.columns]
        
        # Create input sequence
        input_sequence = recent_data[available_columns].values
        
        # Convert to tensor
        input_tensor = torch.FloatTensor(input_sequence).unsqueeze(0)  # Add batch dimension
        input_tensor = input_tensor.to(self.device)
        
        return input_tensor, recent_data
    
    def predict(self, input_sequence, steps=10):
        """
        Make predictions for future steps.
        
        Args:
            input_sequence (torch.Tensor): Input sequence
            steps (int): Number of steps to predict
        
        Returns:
            np.ndarray: Predicted values
        """
        with torch.no_grad():
            predictions = self.model(input_sequence, steps=steps)
        
        return predictions.cpu().numpy()
    
    def inverse_transform_predictions(self, predictions, symbol):
        """
        Inverse transform predictions to original scale.
        
        Args:
            predictions (np.ndarray): Predicted values
            symbol (str): Stock symbol
        
        Returns:
            np.ndarray: Inverse transformed predictions
        """
        if self.scalers is None or symbol not in self.scalers:
            logger.warning("No scalers available. Returning raw predictions.")
            return predictions
        
        # Inverse transform for 'close' price
        close_scaler = self.scalers[symbol]['close']
        
        # Reshape predictions for inverse transform
        predictions_reshaped = predictions.reshape(-1, 1)
        
        # Inverse transform
        original_scale_predictions = close_scaler.inverse_transform(predictions_reshaped)
        
        return original_scale_predictions.flatten()
    
    def evaluate_model(self, test_data, symbols, sequence_length=512, prediction_steps=10):
        """
        Evaluate the model on test data.
        
        Args:
            test_data (pd.DataFrame): Test data
            symbols (list): List of symbols to evaluate
            sequence_length (int): Length of input sequence
            prediction_steps (int): Number of prediction steps
        
        Returns:
            dict: Evaluation metrics
        """
        logger.info("Evaluating model on test data...")
        
        evaluation_results = {}
        
        for symbol in symbols:
            logger.info(f"Evaluating {symbol}...")
            
            try:
                # Prepare input sequence
                input_sequence, recent_data = self.prepare_input_sequence(
                    test_data, symbol, sequence_length
                )
                
                # Make predictions
                predictions = self.predict(input_sequence, prediction_steps)
                
                # Get actual values (next prediction_steps records after input sequence)
                symbol_data = test_data[test_data['symbol'] == symbol].copy()
                symbol_data = symbol_data.sort_values('timestamp')
                
                # Find the index where our input sequence ends
                input_end_index = symbol_data.index[-1]
                
                # Get actual values for the next prediction_steps
                actual_values = []
                for i in range(1, prediction_steps + 1):
                    if input_end_index + i < len(symbol_data):
                        actual_values.append(symbol_data.iloc[input_end_index + i]['close'])
                    else:
                        break
                
                actual_values = np.array(actual_values)
                
                if len(actual_values) > 0:
                    # Inverse transform predictions
                    pred_close = predictions[:, 3]  # Close price is at index 3
                    pred_close_original = self.inverse_transform_predictions(pred_close, symbol)
                    
                    # Calculate metrics
                    mse = mean_squared_error(actual_values[:len(pred_close_original)], pred_close_original)
                    mae = mean_absolute_error(actual_values[:len(pred_close_original)], pred_close_original)
                    rmse = np.sqrt(mse)
                    
                    # Calculate R² score
                    if len(actual_values) > 1:
                        r2 = r2_score(actual_values[:len(pred_close_original)], pred_close_original)
                    else:
                        r2 = 0.0
                    
                    # Calculate Mean Absolute Percentage Error
                    mape = np.mean(np.abs((actual_values[:len(pred_close_original)] - pred_close_original) / 
                                       actual_values[:len(pred_close_original)])) * 100
                    
                    evaluation_results[symbol] = {
                        'mse': float(mse),
                        'mae': float(mae),
                        'rmse': float(rmse),
                        'r2': float(r2),
                        'mape': float(mape),
                        'predictions': pred_close_original.tolist(),
                        'actual_values': actual_values[:len(pred_close_original)].tolist()
                    }
                    
                    logger.info(f"{symbol} - RMSE: {rmse:.4f}, MAE: {mae:.4f}, R²: {r2:.4f}")
                    
                else:
                    logger.warning(f"No actual values available for {symbol}")
                    
            except Exception as e:
                logger.error(f"Error evaluating {symbol}: {str(e)}")
                continue
        
        return evaluation_results
    
    def save_evaluation_results(self, results, output_dir):
        """
        Save evaluation results.
        
        Args:
            results (dict): Evaluation results
            output_dir (str): Output directory
        """
        logger.info("Saving evaluation results...")
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Save results as JSON
        results_file = os.path.join(output_dir, 'metrics_report.json')
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Saved evaluation results to {results_file}")
        
        # Generate summary report
        summary_file = os.path.join(output_dir, 'evaluation_summary.txt')
        with open(summary_file, 'w') as f:
            f.write("Model Evaluation Summary\n")
            f.write("=======================\n\n")
            
            # Calculate average metrics
            all_rmse = [result['rmse'] for result in results.values()]
            all_mae = [result['mae'] for result in results.values()]
            all_r2 = [result['r2'] for result in results.values()]
            all_mape = [result['mape'] for result in results.values()]
            
            f.write(f"Average RMSE: {np.mean(all_rmse):.4f}\n")
            f.write(f"Average MAE: {np.mean(all_mae):.4f}\n")
            f.write(f"Average R²: {np.mean(all_r2):.4f}\n")
            f.write(f"Average MAPE: {np.mean(all_mape):.4f}%\n\n")
            
            f.write("Per-symbol results:\n")
            f.write("------------------\n")
            for symbol, result in results.items():
                f.write(f"{symbol}:\n")
                f.write(f"  RMSE: {result['rmse']:.4f}\n")
                f.write(f"  MAE: {result['mae']:.4f}\n")
                f.write(f"  R²: {result['r2']:.4f}\n")
                f.write(f"  MAPE: {result['mape']:.4f}%\n\n")
        
        logger.info(f"Saved evaluation summary to {summary_file}")
    
    def plot_predictions(self, results, output_dir):
        """
        Plot predictions vs actual values.
        
        Args:
            results (dict): Evaluation results
            output_dir (str): Output directory
        """
        logger.info("Generating prediction plots...")
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        for symbol, result in results.items():
            try:
                plt.figure(figsize=(12, 6))
                
                # Plot actual values
                actual_values = result['actual_values']
                predictions = result['predictions']
                
                x_actual = range(len(actual_values))
                x_pred = range(len(predictions))
                
                plt.plot(x_actual, actual_values, 'b-', label='Actual', linewidth=2)
                plt.plot(x_pred, predictions, 'r--', label='Predicted', linewidth=2)
                
                plt.xlabel('Time Steps')
                plt.ylabel('Price')
                plt.title(f'{symbol} - Actual vs Predicted Prices')
                plt.legend()
                plt.grid(True, alpha=0.3)
                
                # Save plot
                plot_file = os.path.join(output_dir, f'{symbol}_predictions.png')
                plt.savefig(plot_file, dpi=300, bbox_inches='tight')
                plt.close()
                
                logger.info(f"Saved plot for {symbol} to {plot_file}")
                
            except Exception as e:
                logger.error(f"Error plotting {symbol}: {str(e)}")
                continue

def main():
    """
    Main function to evaluate the model.
    """
    # Configuration
    config = {
        'model_path': '/home/z/my-project/indian_market/checkpoints/fine_tuned/Kronos-India-small_best.pth',
        'tokenizer_path': '/home/z/my-project/indian_market/datasets/processed/kronos_tokenizer.pkl',
        'scalers_path': '/home/z/my-project/indian_market/datasets/processed/scalers.pkl',
        'data_path': '/home/z/my-project/indian_market/datasets/processed/ohlcv_data.csv',
        'symbols': ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS'],
        'sequence_length': 512,
        'prediction_steps': 10,
        'output_dir': '/home/z/my-project/indian_market/results/evaluations'
    }
    
    logger.info("Starting model evaluation")
    logger.info(f"Configuration: {config}")
    
    try:
        # Initialize predictor
        predictor = KronosPredictor(
            model_path=config['model_path'],
            device='cuda' if torch.cuda.is_available() else 'cpu'
        )
        
        # Load model
        predictor.load_model()
        
        # Load tokenizer
        predictor.load_tokenizer(config['tokenizer_path'])
        
        # Load scalers
        predictor.load_scalers(config['scalers_path'])
        
        # Load test data
        logger.info(f"Loading test data from {config['data_path']}")
        test_data = pd.read_csv(config['data_path'])
        test_data['timestamp'] = pd.to_datetime(test_data['timestamp'])
        
        # Evaluate model
        evaluation_results = predictor.evaluate_model(
            test_data=test_data,
            symbols=config['symbols'],
            sequence_length=config['sequence_length'],
            prediction_steps=config['prediction_steps']
        )
        
        # Save results
        predictor.save_evaluation_results(evaluation_results, config['output_dir'])
        
        # Plot predictions
        predictor.plot_predictions(evaluation_results, config['output_dir'])
        
        logger.info("Model evaluation completed successfully!")
        
    except Exception as e:
        logger.error(f"Error during evaluation: {str(e)}")
        raise

if __name__ == "__main__":
    main()