import Pagination from '@/app/ui/invoices/pagination';
import Search from '@/app/ui/search';
import Table from '@/app/ui/customers/table';
import { CreateInvoice } from '@/app/ui/invoices/buttons';
import { lusitana } from '@/app/ui/fonts';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { fetchCustomers, fetchFilteredCustomers, fetchInvoicesPages } from '@/app/lib/data';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Customers'
};

export default async function Page(props: {
    searchParams?: Promise<{
        query?: string;
        page?: string;
    }>
}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || '';
    // const currentPage = Number(searchParams?.page) || 1;
    // const totalPages = await fetchInvoicesPages(query);

    // console.log(searchParams);
    // console.log(query);
    // console.log(currentPage);

    const customers = await fetchFilteredCustomers(query);

    return (
        <Table customers={customers} />
    );
}