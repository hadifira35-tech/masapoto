import React from 'react';
import { FormStatus, BookingStatus } from '../../types';

export const FormStatusBadge: React.FC<{ status: FormStatus }> = ({ status }) => {
  switch (status) {
    case 'awaiting_response':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-md bg-zinc-100 text-zinc-800 border border-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
          Menunggu Form
        </span>
      );
    case 'submitted':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-md bg-zinc-900 text-zinc-100">
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          Form Terkirim
        </span>
      );
    case 'expired':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-md bg-zinc-100 text-zinc-500 border border-zinc-200">
          Kedaluwarsa
        </span>
      );
    case 'revoked':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-md bg-zinc-100 text-zinc-700 line-through border border-zinc-300">
          Nonaktif
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-zinc-100 text-zinc-600">
          Draft
        </span>
      );
  }
};

export const BookingStatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
  switch (status) {
    case 'not_confirmed':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">
          Belum Deal
        </span>
      );
    case 'pending_confirmation':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-zinc-200 text-zinc-900 border border-zinc-400">
          Follow-Up
        </span>
      );
    case 'confirmed':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md bg-zinc-950 text-white">
          Confirmed
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-zinc-100 text-zinc-400 line-through">
          Batal
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-zinc-800 text-zinc-100">
          Selesai
        </span>
      );
    default:
      return <span className="text-[11px] text-zinc-500">-</span>;
  }
};
