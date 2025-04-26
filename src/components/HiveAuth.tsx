import React, { useState, useEffect, useRef } from 'react';
import './HiveAuth.css';

// Define the HiveAuth component props
interface HiveAuthProps {
  onLogin: (username: string, token?: string) => void;
  onError: (message: string) => void;
  callbackURL?: string;
}

// Define the Keychain interface to avoid TypeScript errors
declare global {
  interface Window {
    hive_keychain: any;
  }
}

const HiveAuth: React.FC<HiveAuthProps> = ({
  onLogin,
  onError,
  callbackURL = window.location.origin
}) => {
  // State variables
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isKeychainAvailable, setIsKeychainAvailable] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Check if Hive Keychain is available on component mount
  useEffect(() => {
    const checkKeychain = () => {
      const keychainExists = typeof window !== 'undefined' && window.hive_keychain;
      setIsKeychainAvailable(!!keychainExists);
      
      if (!keychainExists) {
        console.info('Hive Keychain extension is not installed. Get it at https://hive-keychain.com/');
      }
    };
    
    checkKeychain();
    
    // If keychain extension is installed after page load
    window.addEventListener('load', checkKeychain);
    
    return () => {
      window.removeEventListener('load', checkKeychain);
    };
  }, []);
  
  // Handle Keychain login
  const handleKeychainLogin = async () => {
    // Clear previous messages
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!username) {
      setErrorMessage('Please enter a username');
      onError('Please enter a username');
      return;
    }
    
    if (!isKeychainAvailable) {
      setErrorMessage('Hive Keychain extension is not installed. Please install it from https://hive-keychain.com/');
      onError('Hive Keychain extension is not installed. Please install it from https://hive-keychain.com/');
      return;
    }
    
    setLoading(true);
    
    try {
      // Random challenge data for the signature
      const challenge = `login-${Date.now()}`;
      
      window.hive_keychain.requestSignBuffer(
        username,
        challenge,
        'Posting',
        (response: any) => {
          setLoading(false);
          
          if (response.success) {
            setSuccessMessage('Login successful!');
            console.log('Successful login with Keychain');
            // Delay the onLogin call slightly to show the success message
            setTimeout(() => {
              onLogin(username);
            }, 1000);
          } else {
            setErrorMessage(response.message || 'Authentication failed');
            onError(response.message || 'Authentication failed');
          }
        }
      );
    } catch (error) {
      setLoading(false);
      console.error('Keychain error:', error);
      setErrorMessage('Keychain operation failed');
      onError('Keychain operation failed');
    }
  };
  
  return (
    <div className="hive-auth-container">
      <div className="hive-auth-input">
        <input
          type="text"
          placeholder="Enter your Hive username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
      </div>
      
      {errorMessage && (
        <div className="hive-auth-message hive-auth-error">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="hive-auth-message hive-auth-success">
          {successMessage}
        </div>
      )}
      
      <div className="hive-auth-buttons">
        <a
          className={`keychain-button ${!isKeychainAvailable || loading ? 'disabled' : ''}`}
          onClick={!loading && isKeychainAvailable ? handleKeychainLogin : undefined}
          href="#"
        >
          {loading ? 'Loading...' : 'Login with Keychain'}
        </a>
        
        {!isKeychainAvailable && (
          <div className="keychain-missing">
            <p>Hive Keychain extension is required</p>
            <a 
              href="https://hive-keychain.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="install-link"
            >
              Install Keychain
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default HiveAuth; 