import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicStudentPortfolio, PortfolioPublicView } from "@/features/finance";

interface PortfolioPageProps {
  params: Promise<{
    username: string;
  }>;
}

export async function generateMetadata({ params }: PortfolioPageProps): Promise<Metadata> {
  const { username } = await params;
  const data = await getPublicStudentPortfolio(username);

  if (!data || data.isHidden) {
    return {
      title: `@${username} | Portofolio Mahasiswa KARTA`,
      description: "Portofolio talenta mahasiswa di platform KARTA",
    };
  }

  return {
    title: `${data.student.name} (@${data.student.username}) | Portofolio Mahasiswa KARTA`,
    description: `Portofolio dan rekam jejak pekerjaan mikro terverifikasi oleh ${data.student.name} dari ${data.student.campus?.name}.`,
  };
}

export default async function PublicPortfolioPage({ params }: PortfolioPageProps) {
  const { username } = await params;
  const data = await getPublicStudentPortfolio(username);

  if (!data) {
    notFound();
  }

  return <PortfolioPublicView data={data} />;
}

