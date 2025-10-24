#!/usr/bin/env python3
"""
Script to fine-tune Kronos model on Indian stock market data.
This script loads a pretrained Kronos model and fine-tunes it on Indian market data.
"""

import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import pandas as pd
import pickle
import logging
from datetime import datetime
import json
from tqdm import tqdm

# Add Kronos to path
sys.path.append('/home/z/my-project/Kronos')

from model.kronos import Kronos
from transformers import AutoConfig, AutoModel

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class IndianStockDataset(Dataset):
    """
    Dataset class for Indian stock market data.
    """
    
    def __init__(self, input_sequences, target_sequences):
        """
        Initialize the dataset.
        
        Args:
            input_sequences (np.ndarray): Input sequences
            target_sequences (np.ndarray): Target sequences
        """
        self.input_sequences = torch.FloatTensor(input_sequences)
        self.target_sequences = torch.FloatTensor(target_sequences)
        
    def __len__(self):
        return len(self.input_sequences)
    
    def __getitem__(self, idx):
        return self.input_sequences[idx], self.target_sequences[idx]

class KronosFineTuner:
    """
    Fine-tuning class for Kronos model.
    """
    
    def __init__(self, model_name='NeoQuasar/Kronos-small', device='cuda' if torch.cuda.is_available() else 'cpu'):
        """
        Initialize the fine-tuner.
        
        Args:
            model_name (str): Name of the pretrained model
            device (str): Device to use for training
        """
        self.model_name = model_name
        self.device = device
        self.model = None
        self.tokenizer = None
        self.optimizer = None
        self.criterion = None
        self.scheduler = None
        
        logger.info(f"Using device: {self.device}")
    
    def load_model(self):
        """
        Load the pretrained Kronos model.
        """
        try:
            logger.info(f"Loading pretrained model: {self.model_name}")
            
            # Load model configuration
            config = AutoConfig.from_pretrained(self.model_name)
            
            # Initialize Kronos model
            self.model = Kronos(config)
            
            # Load pretrained weights
            self.model.load_state_dict(
                AutoModel.from_pretrained(self.model_name).state_dict(),
                strict=False
            )
            
            # Move model to device
            self.model.to(self.device)
            
            logger.info("Model loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    
    def load_tokenizer(self, tokenizer_path):
        """
        Load the trained tokenizer.
        
        Args:
            tokenizer_path (str): Path to the tokenizer file
        """
        try:
            logger.info(f"Loading tokenizer from {tokenizer_path}")
            
            with open(tokenizer_path, 'rb') as f:
                tokenizer_data = pickle.load(f)
            
            self.tokenizer = tokenizer_data
            logger.info("Tokenizer loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading tokenizer: {str(e)}")
            raise
    
    def load_data(self, data_path):
        """
        Load tokenized training data.
        
        Args:
            data_path (str): Path to the tokenized data file
        
        Returns:
            tuple: (train_loader, val_loader)
        """
        try:
            logger.info(f"Loading tokenized data from {data_path}")
            
            with open(data_path, 'rb') as f:
                data = pickle.load(f)
            
            input_sequences = data['input_sequences']
            target_sequences = data['target_sequences']
            
            # Split into train and validation sets
            train_size = int(0.8 * len(input_sequences))
            val_size = len(input_sequences) - train_size
            
            train_input = input_sequences[:train_size]
            train_target = target_sequences[:train_size]
            val_input = input_sequences[train_size:]
            val_target = target_sequences[train_size:]
            
            # Create datasets
            train_dataset = IndianStockDataset(train_input, train_target)
            val_dataset = IndianStockDataset(val_input, val_target)
            
            # Create data loaders
            train_loader = DataLoader(
                train_dataset, 
                batch_size=16, 
                shuffle=True, 
                num_workers=2
            )
            val_loader = DataLoader(
                val_dataset, 
                batch_size=16, 
                shuffle=False, 
                num_workers=2
            )
            
            logger.info(f"Data loaded successfully")
            logger.info(f"Training samples: {len(train_dataset)}")
            logger.info(f"Validation samples: {len(val_dataset)}")
            
            return train_loader, val_loader
            
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            raise
    
    def setup_training(self, learning_rate=1e-5):
        """
        Setup training components.
        
        Args:
            learning_rate (float): Learning rate for optimizer
        """
        # Setup optimizer
        self.optimizer = optim.AdamW(
            self.model.parameters(), 
            lr=learning_rate,
            weight_decay=0.01
        )
        
        # Setup loss function
        self.criterion = nn.MSELoss()
        
        # Setup learning rate scheduler
        self.scheduler = optim.lr_scheduler.CosineAnnealingLR(
            self.optimizer, 
            T_max=10, 
            eta_min=1e-6
        )
        
        logger.info("Training components setup completed")
    
    def train_epoch(self, train_loader, epoch):
        """
        Train for one epoch.
        
        Args:
            train_loader (DataLoader): Training data loader
            epoch (int): Current epoch number
        
        Returns:
            float: Average training loss
        """
        self.model.train()
        total_loss = 0.0
        
        progress_bar = tqdm(train_loader, desc=f'Epoch {epoch+1}')
        
        for batch_idx, (inputs, targets) in enumerate(progress_bar):
            inputs = inputs.to(self.device)
            targets = targets.to(self.device)
            
            # Forward pass
            self.optimizer.zero_grad()
            outputs = self.model(inputs)
            
            # Calculate loss
            loss = self.criterion(outputs, targets)
            
            # Backward pass
            loss.backward()
            
            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            
            # Update weights
            self.optimizer.step()
            
            total_loss += loss.item()
            
            # Update progress bar
            progress_bar.set_postfix({'loss': loss.item()})
        
        avg_loss = total_loss / len(train_loader)
        return avg_loss
    
    def validate(self, val_loader):
        """
        Validate the model.
        
        Args:
            val_loader (DataLoader): Validation data loader
        
        Returns:
            float: Average validation loss
        """
        self.model.eval()
        total_loss = 0.0
        
        with torch.no_grad():
            for inputs, targets in val_loader:
                inputs = inputs.to(self.device)
                targets = targets.to(self.device)
                
                outputs = self.model(inputs)
                loss = self.criterion(outputs, targets)
                
                total_loss += loss.item()
        
        avg_loss = total_loss / len(val_loader)
        return avg_loss
    
    def fine_tune(self, train_loader, val_loader, epochs=10, save_dir='/home/z/my-project/indian_market/checkpoints/fine_tuned'):
        """
        Fine-tune the model.
        
        Args:
            train_loader (DataLoader): Training data loader
            val_loader (DataLoader): Validation data loader
            epochs (int): Number of training epochs
            save_dir (str): Directory to save checkpoints
        """
        logger.info(f"Starting fine-tuning for {epochs} epochs")
        
        # Create save directory
        os.makedirs(save_dir, exist_ok=True)
        
        # Training history
        history = {
            'train_loss': [],
            'val_loss': []
        }
        
        best_val_loss = float('inf')
        
        for epoch in range(epochs):
            logger.info(f"Epoch {epoch+1}/{epochs}")
            
            # Train
            train_loss = self.train_epoch(train_loader, epoch)
            
            # Validate
            val_loss = self.validate(val_loader)
            
            # Update learning rate
            self.scheduler.step()
            
            # Save history
            history['train_loss'].append(train_loss)
            history['val_loss'].append(val_loss)
            
            logger.info(f"Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")
            
            # Save best model
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                checkpoint_path = os.path.join(save_dir, 'Kronos-India-small_best.pth')
                torch.save({
                    'epoch': epoch,
                    'model_state_dict': self.model.state_dict(),
                    'optimizer_state_dict': self.optimizer.state_dict(),
                    'scheduler_state_dict': self.scheduler.state_dict(),
                    'train_loss': train_loss,
                    'val_loss': val_loss,
                    'history': history
                }, checkpoint_path)
                logger.info(f"Saved best model to {checkpoint_path}")
            
            # Save checkpoint every epoch
            checkpoint_path = os.path.join(save_dir, f'Kronos-India-small_epoch_{epoch+1}.pth')
            torch.save({
                'epoch': epoch,
                'model_state_dict': self.model.state_dict(),
                'optimizer_state_dict': self.optimizer.state_dict(),
                'scheduler_state_dict': self.scheduler.state_dict(),
                'train_loss': train_loss,
                'val_loss': val_loss,
                'history': history
            }, checkpoint_path)
        
        # Save final model
        final_checkpoint_path = os.path.join(save_dir, 'Kronos-India-small_final.pth')
        torch.save({
            'epoch': epochs,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'scheduler_state_dict': self.scheduler.state_dict(),
            'train_loss': train_loss,
            'val_loss': val_loss,
            'history': history
        }, final_checkpoint_path)
        
        # Save training history
        history_path = os.path.join(save_dir, 'training_history.json')
        with open(history_path, 'w') as f:
            json.dump(history, f, indent=2)
        
        logger.info(f"Fine-tuning completed! Best validation loss: {best_val_loss:.4f}")
        logger.info(f"Models saved to {save_dir}")

def main():
    """
    Main function to fine-tune the model.
    """
    # Configuration
    config = {
        'model_name': 'NeoQuasar/Kronos-small',
        'tokenizer_path': '/home/z/my-project/indian_market/datasets/processed/kronos_tokenizer.pkl',
        'data_path': '/home/z/my-project/indian_market/datasets/processed/tokenized_data.pkl',
        'epochs': 10,
        'learning_rate': 1e-5,
        'save_dir': '/home/z/my-project/indian_market/checkpoints/fine_tuned'
    }
    
    logger.info("Starting Kronos fine-tuning for Indian stock market")
    logger.info(f"Configuration: {config}")
    
    try:
        # Initialize fine-tuner
        fine_tuner = KronosFineTuner(
            model_name=config['model_name'],
            device='cuda' if torch.cuda.is_available() else 'cpu'
        )
        
        # Load model
        fine_tuner.load_model()
        
        # Load tokenizer
        fine_tuner.load_tokenizer(config['tokenizer_path'])
        
        # Load data
        train_loader, val_loader = fine_tuner.load_data(config['data_path'])
        
        # Setup training
        fine_tuner.setup_training(learning_rate=config['learning_rate'])
        
        # Fine-tune model
        fine_tuner.fine_tune(
            train_loader=train_loader,
            val_loader=val_loader,
            epochs=config['epochs'],
            save_dir=config['save_dir']
        )
        
        logger.info("Fine-tuning completed successfully!")
        
    except Exception as e:
        logger.error(f"Error during fine-tuning: {str(e)}")
        raise

if __name__ == "__main__":
    main()