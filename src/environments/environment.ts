// Development environment configuration
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyA2HwCC8Uowa9Px2uiqKXUaeEQUgzMy8Ns',
    authDomain: 'space-runner-pwa.firebaseapp.com',
    databaseURL: 'https://space-runner-pwa-default-rtdb.firebaseio.com',
    projectId: 'space-runner-pwa',
    storageBucket: 'space-runner-pwa.firebasestorage.app',
    messagingSenderId: '383954222651',
    appId: '1:383954222651:web:0913fc318ab205dd79261e'
  } as FirebaseConfig
};
