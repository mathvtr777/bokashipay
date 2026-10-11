'use client';
import React from 'react';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import Image from 'next/image';

/**
 * DashboardScroll — wrapper do `ContainerScroll` (parallax 3D em scroll)
 * mostrando a imagem do dashboard do BokashiPay. Importado pela `landing-page`.
 */
export default function DashboardScroll() {
  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="font-display text-4xl font-semibold text-bp-mist md:text-5xl">
              Seu painel completo
            </h1>
            <span className="mt-1 inline-block font-display text-4xl font-bold leading-none text-bp-mist md:text-[6rem]">
              <span className="gradient-text">em um só lugar.</span>
            </span>
          </>
        }
      >
        <div className="relative h-full w-full overflow-hidden">
          <Image
            src="/images/dashboard-bokashi.webp"
            alt="Dashboard do BokashiPay mostrando saldo, vendas e gráfico"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
            quality={90}
            className="object-cover"
            draggable={false}
          />
        </div>
      </ContainerScroll>
    </div>
  );
}
