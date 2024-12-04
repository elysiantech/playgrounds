import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import InteractiveImage from "./interactive";
import { ImageData } from '@/lib/types'

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
        title: `Shared on Playgrounds by ${user.name}`,
        description: `Explore the unique image generated from a text prompt. ID: ${id}`,
        image: `${process.env.NEXTAUTH_URL}/share/${image.url}`,
    };

    return {
        title: metadata.title,
        description: metadata.description,
        openGraph: {
            type: 'website',
            title: metadata.title,
            description: metadata.description,
            url: metadata.image,
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
        url: image.url,
        prompt: image.prompt,
        model: image.model,
        creativity: image.creativity,
        steps: image.steps,
        seed: image.seed,
        metadata: {},
        bookmark: image.bookmark,
        numberOfImages: 1,
        refImage: image.refImage ?? undefined
      }
    return <InteractiveImage image={imageData} />;
}
