import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import InteractiveImage from "./interactive";
import { ImageData, VideoData } from '@/lib/types'

interface MetadataProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MetadataProps) {
    const id = (await params).id;
    const image = await prisma.image.findUnique({ where: { id }, include: { user: true }, });
    if (!image || !image.url) {
        return;
    }
    const { user } = image
    const metadata = {
        title: `Check out this creation by ${user.name}`,
        description: `Discover this unique artwork generated with AI. Explore more creations and share your own!`,
        image: `${process.env.NEXTAUTH_URL}/share/${image.url}`,
        url: `${process.env.NEXTAUTH_URL}/share/${id}`,
      };

      return {
        title: metadata.title,
        description: metadata.description,
        openGraph: {
          type: 'website',
          title: metadata.title,
          description: metadata.description,
          url: metadata.url,
          images: [
            {
              url: metadata.image,
              width: 1200,
              height: 630,
              alt: metadata.title,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: metadata.title,
          description: metadata.description,
          images: [metadata.image],
        },
      };
}

// Server Component
export default async function ImagePage({ params }: MetadataProps ) {
    const id = (await params).id;
    const image = await prisma.image.findUnique({ where: { id } });
    if (!image) return notFound();
    const imageData:ImageData = {
        id: image.id,
        url: image.url!,
        prompt: image.prompt,
        model: image.model,
        creativity: image.creativity,
        steps: image.steps,
        seed: image.seed,
        metadata: {},
        bookmark: image.bookmark,
        numberOfImages: 1,
        aspectRatio: image.aspectRatio ?? undefined,
        refImage: image.refImage ?? undefined,
        likes: image.likes,
      }
    return <InteractiveImage image={imageData} />;
}
