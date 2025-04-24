// Remove 'use client' directive
// import { useEffect } from "react"; // Remove useEffect import

// Function to generate the theme setting script as a string
const getThemeScriptContent = () => {
  // This IIFE (Immediately Invoked Function Expression) runs instantly
  return `(
    () => {
      try {
        const themeCookie = document.cookie.match(/theme=([^;]+)/)?.[1];
        const savedTheme = localStorage.getItem("theme") || themeCookie;
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        // Determine the theme: use saved theme, or system preference, or default to light
        const theme = savedTheme || (prefersDark ? "dark" : "light"); 
        
        // Apply the theme class to the <html> element
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        // Also update the cookie for subsequent server renders
        // Set a long expiry, e.g., 1 year
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        document.cookie = \`theme=\${theme};path=/;expires=\${expiryDate.toUTCString()};SameSite=Lax\`;

      } catch (e) {
        // Ignore errors like localStorage not being available
        console.warn('Error applying initial theme:', e);
      }
    }
  )();`;
};

export function ThemeScript() {
  // Render the script tag with the immediately executing function
  return (
    <script 
      id="theme-script" // Add an ID for clarity
      dangerouslySetInnerHTML={{ __html: getThemeScriptContent() }}
    />
  );
}