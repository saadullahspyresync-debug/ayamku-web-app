import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify';
import config from './config/amplify.ts';
import App from './App.js'
import './index.css'
import "./i18n.js";


createRoot(document.getElementById("root")!).render(<App />);
