import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen px-4 py-16">
      <div className="flex flex-col items-center gap-6 text-center">
        <Image
          src="/logo/1x/Asset 1.png"
          alt="The Happy Cup logo"
          width={120}
          height={120}
          priority
        />
        <h1 className="text-4xl font-bold tracking-tight text-warm-600">
          The Happy Cup
        </h1>
        <p className="text-lg italic text-warm-400">sip. smile. repeat.</p>
        <p className="text-sm font-medium tracking-widest uppercase text-warm-500">
          Coming Soon
        </p>
      </div>
    </main>
  );
}
