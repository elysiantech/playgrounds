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