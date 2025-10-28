#!/usr/bin/env python3
"""
Script to download OHLCV data for NSE stocks using yfinance.
This script downloads historical data for major Indian stocks and saves it to CSV format.
"""

import yfinance as yf
import pandas as pd
import os
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# NSE stocks to download
NSE_STOCKS = {
    'RELIANCE.NS': 'Reliance Industries',
    'TCS.NS': 'Tata Consultancy Services',
    'INFY.NS': 'Infosys',
    'HDFCBANK.NS': 'HDFC Bank',
    'NIFTY50.NS': 'Nifty 50 Index',
    'BANKNIFTY.NS': 'Bank Nifty Index'
}

def download_stock_data(symbol, name, start_date, end_date):
    """
    Download historical stock data for a given symbol.
    
    Args:
        symbol (str): Stock symbol (e.g., 'RELIANCE.NS')
        name (str): Full name of the stock
        start_date (str): Start date in 'YYYY-MM-DD' format
        end_date (str): End date in 'YYYY-MM-DD' format
    
    Returns:
        pd.DataFrame: DataFrame containing OHLCV data
    """
    try:
        logger.info(f"Downloading data for {name} ({symbol})")
        
        # Download data using yfinance
        stock = yf.Ticker(symbol)
        data = stock.history(start=start_date, end=end_date)
        
        if data.empty:
            logger.warning(f"No data found for {symbol}")
            return None
        
        # Reset index to make timestamp a column
        data = data.reset_index()
        
        # Rename columns to match Kronos format
        data = data.rename(columns={
            'Date': 'timestamp',
            'Open': 'open',
            'High': 'high',
            'Low': 'low',
            'Close': 'close',
            'Volume': 'volume'
        })
        
        # Ensure timestamp is in datetime format
        data['timestamp'] = pd.to_datetime(data['timestamp'])
        
        # Add symbol column
        data['symbol'] = symbol
        
        # Remove any rows with missing values
        data = data.dropna()
        
        logger.info(f"Downloaded {len(data)} rows of data for {symbol}")
        return data
        
    except Exception as e:
        logger.error(f"Error downloading data for {symbol}: {str(e)}")
        return None

def main():
    """
    Main function to download data for all NSE stocks.
    """
    # Create output directory if it doesn't exist
    output_dir = '/home/z/my-project/indian_market/datasets/raw'
    os.makedirs(output_dir, exist_ok=True)
    
    # Set date range (last 5 years)
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=5*365)).strftime('%Y-%m-%d')
    
    logger.info(f"Downloading data from {start_date} to {end_date}")
    
    all_data = []
    
    # Download data for each stock
    for symbol, name in NSE_STOCKS.items():
        data = download_stock_data(symbol, name, start_date, end_date)
        if data is not None:
            all_data.append(data)
            
            # Save individual stock data
            individual_file = os.path.join(output_dir, f"{symbol.replace('.', '_')}.csv")
            data.to_csv(individual_file, index=False)
            logger.info(f"Saved individual data to {individual_file}")
    
    if all_data:
        # Combine all data into a single DataFrame
        combined_data = pd.concat(all_data, ignore_index=True)
        
        # Sort by timestamp and symbol
        combined_data = combined_data.sort_values(['timestamp', 'symbol'])
        
        # Save combined data
        combined_file = os.path.join(output_dir, 'nse_stocks_combined.csv')
        combined_data.to_csv(combined_file, index=False)
        
        logger.info(f"Saved combined data to {combined_file}")
        logger.info(f"Total records: {len(combined_data)}")
        logger.info(f"Date range: {combined_data['timestamp'].min()} to {combined_data['timestamp'].max()}")
        
        # Print summary statistics
        logger.info("\nSummary Statistics:")
        logger.info(f"Unique symbols: {combined_data['symbol'].nunique()}")
        for symbol in combined_data['symbol'].unique():
            symbol_data = combined_data[combined_data['symbol'] == symbol]
            logger.info(f"{symbol}: {len(symbol_data)} records")
    else:
        logger.error("No data was downloaded successfully")

if __name__ == "__main__":
    main()