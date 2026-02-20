"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface Document {
  id: string
  type: string
  fileName: string
  status: string
  generatedAt: Date | string
  updatedAt: Date | string
}

export function DocumentsStatus() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
    // Refresh documents every 30 seconds
    const interval = setInterval(fetchDocuments, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents")
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
      case "filed":
      case "accepted":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "draft":
        return <Clock className="h-5 w-5 text-yellow-600" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
      case "filed":
      case "accepted":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Loading documents...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Status</CardTitle>
        <CardDescription>
          Track the status of your generated documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No documents generated yet</p>
            <Link href="/questionnaires">
              <button className="text-blue-600 hover:underline">
                Start a questionnaire to generate documents
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-shrink-0">{getStatusIcon(doc.status)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{doc.fileName}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${getStatusColor(doc.status)}`}
                    >
                      {getStatusLabel(doc.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Type: {doc.type.replace("_", " ")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Generated: {format(new Date(doc.generatedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
