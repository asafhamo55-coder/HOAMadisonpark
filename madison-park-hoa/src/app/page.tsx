import Image from "next/image"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <Image
        src="/logo.svg"
        alt="Madison Park HOA"
        width={128}
        height={128}
        priority
      />
      <h1 className="text-4xl font-bold tracking-tight">
        {process.env.NEXT_PUBLIC_HOA_NAME}
      </h1>
      <p className="text-muted-foreground">
        Welcome to the Madison Park Homeowners Association portal.
      </p>
    </div>
  )
}
