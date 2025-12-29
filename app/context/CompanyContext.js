"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addloading, setaddloading] = useState(false)

  const fetchCompany = async () => {
    try {
      const res = await fetch("/api/company");
      const data = await res.json();
      setCompany(data);
    } catch {
      toast.error("Failed to load company data");
    } finally {
      setLoading(false);
    }
  };

  const saveCompany = async (updatedData) => {

    try {
      setaddloading(true)
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();
      setaddloading(false)
      if (data.success) {
        setCompany(data.company);
        toast.success("Company details saved!");
      } else {
        toast.error("Failed to save company details");
      }
    } catch {
      toast.error("Error saving company");
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  return (
    <CompanyContext.Provider
      value={{ company, setCompany, loading, saveCompany, addloading }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => useContext(CompanyContext);
