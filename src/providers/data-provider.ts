import type { DataProvider } from "@refinedev/core";
import { getSession } from "next-auth/react";

const API_URL = "/api";

const fetcher = async (url: string, options?: RequestInit) => {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized - No valid session");
  }
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: "Bearer",
    },
  });
};

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    const params = new URLSearchParams();

    if (pagination?.current && pagination?.pageSize) {
      params.append("_start", String((pagination.current - 1) * pagination.pageSize));
      params.append("_end", String(pagination.current * pagination.pageSize));
    }

    if (sorters?.length) {
      params.append("_sort", sorters.map((sorter) => sorter.field).join(","));
      params.append("_order", sorters.map((sorter) => sorter.order).join(","));
    }

    if (filters?.length) {
      filters.forEach((filter) => {
        if ("field" in filter && filter.operator === "eq") {
          params.append(filter.field, String(filter.value));
        }
      });
    }

    const response = await fetcher(`${API_URL}/${resource}?${params.toString()}`);
    if (response.status < 200 || response.status > 299) throw response;

    const { data, total } = await response.json();
    return { data, total };
  },
  getMany: async ({ resource, ids }) => {
    const params = new URLSearchParams();
    ids?.forEach((id) => params.append("id", String(id)));

    const response = await fetcher(`${API_URL}/${resource}?${params.toString()}`);
    // if (response.status < 200 || response.status > 299) throw response;

    const { data } = await response.json();
    return { data };
  },
  getOne: async ({ resource, id }) => {
    const response = await fetcher(`${API_URL}/${resource}/${id}`);
    if (response.status < 200 || response.status > 299) throw response;

    const { data } = await response.json();
    return { data };
  },
  create: async ({ resource, variables }) => {
    const response = await fetcher(`${API_URL}/${resource}`, {
      method: "POST",
      body: JSON.stringify(variables),
      headers: { "Content-Type": "application/json" },
    });
    if (response.status < 200 || response.status > 299) throw response;

    const { data } = await response.json();
    return { data };
  },
  update: async ({ resource, id, variables }) => {
    const response = await fetcher(`${API_URL}/${resource}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(variables),
      headers: { "Content-Type": "application/json" },
    });
    if (response.status < 200 || response.status > 299) throw response;

    const { data } = await response.json();
    return { data };
  },
  deleteOne: async ({ resource, id }) => {
    const response = await fetcher(`${API_URL}/${resource}/${id}`, {
      method: "DELETE",
    });
    if (response.status < 200 || response.status > 299) throw response;

    const { data } = await response.json();
    return { data };
  },
  custom: async ({ url, method, payload, headers }) => {
    const response = await fetcher(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    if (response.status < 200 || response.status > 299) throw response;

    const { data } = await response.json();
    return { data };
  },
  getApiUrl: () => API_URL,
};