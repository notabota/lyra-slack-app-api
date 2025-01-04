"use client";

import { useParams } from "next/navigation";
import ShowInteractivityContent from "./ShowInteractivityContent";

export default function ShowInteractivity() {
    const { id } = useParams();
    return <ShowInteractivityContent id={id as string} />;
}