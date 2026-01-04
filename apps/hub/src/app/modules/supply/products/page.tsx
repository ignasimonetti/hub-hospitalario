import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { getProducts, getSupplyCategories } from "@/app/actions/supply";
import { ProductListClient } from "@/components/modules/supply/products/product-list-client";

export default async function SupplyProductsPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string; c?: string; s?: string }>
}) {
    const params = await searchParams;
    const search = params.q || "";
    const category = params.c || "";
    const sort = params.s || "name";

    const { items: products, totalItems } = await getProducts({
        page: 1,
        perPage: 150, // Load more for better UX, but keep it snappy
        search,
        category,
        sort
    });
    const categories = await getSupplyCategories();

    return (
        <div className="container mx-auto py-8 space-y-8 max-w-7xl px-4 lg:px-8">
            {/* Premium Header */}
            <div className="flex flex-col gap-2 border-b border-gray-200 dark:border-slate-800 pb-8">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    <Link href="/modules/supply" className="hover:text-blue-500 transition-colors">Suministros</Link>
                    <span>/</span>
                    <span className="text-slate-600 dark:text-slate-300">Catálogo</span>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/modules/supply" className="group p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
                        <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Catálogo de Productos</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-lg">
                            Gestión maestra de insumos, medicamentos y stock.
                        </p>
                    </div>
                </div>
            </div>

            {/* Client Component for Interactivity */}
            <ProductListClient initialItems={products} categories={categories} totalItems={totalItems} />
        </div>
    );
}
