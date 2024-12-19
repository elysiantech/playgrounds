import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import storage from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid';

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
  spinner: boolean = false
): string {
    const spinnerSize = Math.min(width, height) / 6;
    const fontSize = Math.min(width, height) / 15;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="#f0f0f0" />
        ${
          spinner
            ? `
          <circle 
            cx="${width / 2}" 
            cy="${height / 3}" 
            r="${spinnerSize}" 
            fill="none" 
            stroke="#999" 
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
        <text x="50%" y="${height / 2}" font-size="${fontSize}" text-anchor="middle" fill="#333" dy="-0.5em">
          ${title}
        </text>
        <text x="50%" y="${height / 2}" font-size="${fontSize * 0.8}" text-anchor="middle" fill="#666" dy="1em">
          ${subtitleText}
        </text>
      </svg>
    `;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}


export async function processBase64Image(content: string): Promise<string> {
  const [mimePart, base64Image] = content.split(",");
  const mimeMatch = mimePart.match(/data:image\/([a-zA-Z]+);base64/);
  const extension = mimeMatch ? mimeMatch[1] : "png";
  const filename = `${uuidv4()}.${extension}`;
  const buffer = Buffer.from(base64Image, "base64");
  await storage.putObject(filename, buffer);
  return filename;
}

export const getLocalUrl = async (param?: string): Promise<string | undefined> => {
    if (!param) return undefined;
    if (param.startsWith('http')) {
        const res = await fetch(param)
        if (!res.ok) return undefined;
        const url = `${uuidv4()}.jpg`
        await storage.putObject(url, Buffer.from( await res.arrayBuffer() ))
        return url;
    } else if (param.startsWith('data:image')){
        return  await processBase64Image(param)
    } else return param;
};

export const getRemoteUrl = async (param?: string): Promise<string | undefined> => {
    if (!param) return undefined;
    if (param.startsWith('http')) return param;
    return param.startsWith('data:image')
      ? storage.getUrl(await processBase64Image(param))
      : storage.getUrl(param);
};

