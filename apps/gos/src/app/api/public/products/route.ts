import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic="force-dynamic";
export async function GET(){try{const data=await prisma.product.findMany({where:{status:"ACTIVE"},select:{id:true,name:true,slug:true,description:true,kind:true,price:true,currency:true,licenseTerms:true,previewUrl:true},orderBy:[{sortOrder:"asc"},{name:"asc"}],take:200});return NextResponse.json({data:data.map(p=>({...p,price:p.price===null?null:Number(p.price)}))},{headers:{"Cache-Control":"public, max-age=60, stale-while-revalidate=300"}});}catch{return NextResponse.json({error:"Produk belum tersedia."},{status:503,headers:{"Cache-Control":"no-store"}});}}
