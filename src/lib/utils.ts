import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function processWithConcurrencyLimit<T, R>(
  tasks: T[], // Array of input tasks
  concurrency: number, // Maximum concurrency level
  processor: (task: T) => Promise<R> // Function to process each task
): Promise<R[]> {
  const results: Promise<R>[] = [];
  const executing = new Set<Promise<R>>();

  for (const task of tasks) {
    const promise = processor(task).then((result) => {
      executing.delete(promise);
      return result;
    });
    results.push(promise);
    executing.add(promise);

    if (executing.size >= concurrency) {
      await Promise.race(executing); // Wait for at least one task to finish
    }
  }

  return Promise.all(results);
}

export function generatePlaceholderImage(
  title: string,
  subtitleText: string,
  width: number,
  height: number,
  spinner: boolean = false,
  theme: 'dark' | 'light' = 'light'
): string {
  const spinnerSize = Math.min(width, height) / 6;
  const fontSize = Math.min(width, height) / 15;
  const dotSize = Math.min(width, height) / 40;
  const bgColor = theme === 'dark' ? '#2e2e2e' : '#d3d3d3'; // Dark grey for dark theme, light grey for light theme
  const textColor = theme === 'dark' ? '#ffffff' : '#333333'; // White for dark theme, dark grey for light theme
  const subtitleColor = theme === 'dark' ? '#cccccc' : '#666666'; // Light grey for dark theme, medium grey for light theme

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="${bgColor}" />
      
      <!-- Spinner -->
      ${
        spinner
          ? `
        <circle 
          cx="${width / 2}" 
          cy="${height / 3}" 
          r="${spinnerSize}" 
          fill="none" 
          stroke="${textColor}" 
          stroke-width="4" 
          stroke-dasharray="30,10">
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="0 ${width / 2} ${height / 3}" 
            to="360 ${width / 2} ${height / 3}" 
            dur="1s" 
            repeatCount="indefinite" />
        </circle>`
          : ''
      }

      <!-- Title -->
      <text 
        x="50%" 
        y="${height / 2}" 
        font-family="'Arial', sans-serif" 
        font-size="${fontSize}" 
        text-anchor="middle" 
        fill="${textColor}" 
        dy="-0.5em">
        ${title}
      </text>
      
      <!-- Subtitle -->
      <text 
        x="50%" 
        y="${height / 2}" 
        font-family="'Arial', sans-serif" 
        font-size="${fontSize * 0.8}" 
        text-anchor="middle" 
        fill="${subtitleColor}" 
        dy="1em">
        ${subtitleText}
      </text>
      
      <!-- Feedback Dots -->
      <g transform="translate(${width / 2 - (dotSize * 3)}, ${height / 2 + fontSize * 1.5})">
        <circle cx="${dotSize}" cy="0" r="${dotSize / 2}" fill="${subtitleColor}">
          <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" begin="0s" />
        </circle>
        <circle cx="${dotSize * 3}" cy="0" r="${dotSize / 2}" fill="${subtitleColor}">
          <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" begin="0.2s" />
        </circle>
        <circle cx="${dotSize * 6}" cy="0" r="${dotSize / 2}" fill="${subtitleColor}">
          <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" begin="0.4s" />
        </circle>
      </g>
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
