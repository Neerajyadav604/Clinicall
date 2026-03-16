import React, { useState } from "react";
import jsPDF from "jspdf";
import axios from "axios";

const RecordCard = ({ record, isPatient = false }) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const baseURL = process.env.REACT_APP_BASE_URL || "http://localhost:4000";
  const token = localStorage.getItem("token");

  const axiosInstance = axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const getRecordTypeLabel = (type) => {
    const labels = {
      prescription: { label: "Prescription", icon: "💊", color: "blue" },
      lab_report: { label: "Lab Report", icon: "🧪", color: "purple" },
      diagnosis: { label: "Diagnosis", icon: "📋", color: "green" },
      vitals: { label: "Vitals", icon: "❤️", color: "red" },
    };
    return labels[type] || { label: type, icon: "📄", color: "gray" };
  };

  const generatePDF = async () => {
    try {
      setDownloading(true);
      setError("");

      // Get full record data if needed
      const recordId = record._id || record.recordId;
      let fullRecord = record;

      if (recordId && !record.content) {
        const response = await axiosInstance.get(
          `/consultation/download/${recordId}`
        );
        if (response.data.success) {
          fullRecord = response.data.data.record;
        }
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.text("Medical Record", 20, yPosition);
      yPosition += 15;

      // Record type and title
      const typeInfo = getRecordTypeLabel(fullRecord.recordType);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Type: ${typeInfo.label}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Title: ${fullRecord.title}`, 20, yPosition);
      yPosition += 10;

      // Date
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      const date = new Date(fullRecord.createdAt);
      doc.text(
        `Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`,
        20,
        yPosition
      );
      yPosition += 10;

      // Content
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.text("Details:", 20, yPosition);
      yPosition += 8;

      if (fullRecord.recordType === "prescription" && fullRecord.medication) {
        const med = fullRecord.medication;
        doc.setFontSize(10);
        if (med.name) {
          doc.text(`Medication: ${med.name}`, 25, yPosition);
          yPosition += 7;
        }
        if (med.dosage) {
          doc.text(`Dosage: ${med.dosage}`, 25, yPosition);
          yPosition += 7;
        }
        if (med.frequency) {
          doc.text(`Frequency: ${med.frequency}`, 25, yPosition);
          yPosition += 7;
        }
        if (med.duration) {
          doc.text(`Duration: ${med.duration}`, 25, yPosition);
          yPosition += 7;
        }
        if (med.instructions) {
          doc.setFontSize(9);
          const instructionsLines = doc.splitTextToSize(med.instructions, 170);
          doc.text("Instructions:", 25, yPosition);
          yPosition += 5;
          doc.text(instructionsLines, 25, yPosition);
          yPosition += 5;
        }
      } else if (fullRecord.recordType === "lab_report" && fullRecord.labTest) {
        const lab = fullRecord.labTest;
        doc.setFontSize(10);
        if (lab.testName) {
          doc.text(`Test Name: ${lab.testName}`, 25, yPosition);
          yPosition += 7;
        }
        if (lab.result) {
          doc.text(`Result: ${lab.result}`, 25, yPosition);
          yPosition += 7;
        }
        if (lab.unit) {
          doc.text(`Unit: ${lab.unit}`, 25, yPosition);
          yPosition += 7;
        }
        if (lab.referenceRange) {
          doc.text(`Reference Range: ${lab.referenceRange}`, 25, yPosition);
          yPosition += 7;
        }
        if (lab.status) {
          doc.text(`Status: ${lab.status}`, 25, yPosition);
          yPosition += 7;
        }
      } else if (fullRecord.recordType === "vitals" && fullRecord.vitals) {
        const v = fullRecord.vitals;
        doc.setFontSize(10);
        if (v.temperature) {
          doc.text(`Temperature: ${v.temperature}`, 25, yPosition);
          yPosition += 7;
        }
        if (v.bloodPressure) {
          doc.text(`Blood Pressure: ${v.bloodPressure}`, 25, yPosition);
          yPosition += 7;
        }
        if (v.heartRate) {
          doc.text(`Heart Rate: ${v.heartRate}`, 25, yPosition);
          yPosition += 7;
        }
        if (v.respiratoryRate) {
          doc.text(`Respiratory Rate: ${v.respiratoryRate}`, 25, yPosition);
          yPosition += 7;
        }
        if (v.oxygenSaturation) {
          doc.text(`Oxygen Saturation: ${v.oxygenSaturation}`, 25, yPosition);
          yPosition += 7;
        }
        if (v.weight) {
          doc.text(`Weight: ${v.weight}`, 25, yPosition);
          yPosition += 7;
        }
        if (v.height) {
          doc.text(`Height: ${v.height}`, 25, yPosition);
          yPosition += 7;
        }
      } else if (fullRecord.recordType === "diagnosis") {
        doc.setFontSize(10);
        if (fullRecord.notes) {
          const notesLines = doc.splitTextToSize(fullRecord.notes, 170);
          doc.text(notesLines, 25, yPosition);
          yPosition += 5;
        }
      }

      // General content
      if (fullRecord.content) {
        yPosition += 5;
        doc.setFontSize(10);
        doc.text("Additional Details:", 20, yPosition);
        yPosition += 7;
        const contentLines = doc.splitTextToSize(fullRecord.content, 170);
        doc.text(contentLines, 25, yPosition);
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      const footerY = pageHeight - 10;
      doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        20,
        footerY
      );
      doc.text("Clinicall Medical Records", pageWidth - 20, footerY, {
        align: "right",
      });

      // Save PDF
      const fileName = `medical-record-${fullRecord.recordType}-${new Date().getTime()}.pdf`;
      doc.save(fileName);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to generate PDF";
      setError(errorMsg);
      console.error("Error generating PDF:", err);
    } finally {
      setDownloading(false);
    }
  };

  const typeInfo = getRecordTypeLabel(record.recordType);
  const colorClass = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
    green: "bg-green-50 border-green-200 text-green-800",
    red: "bg-red-50 border-red-200 text-red-800",
    gray: "bg-gray-50 border-gray-200 text-gray-800",
  }[typeInfo.color];

  return (
    <div className={`border rounded-lg p-4 ${colorClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{typeInfo.icon}</span>
            <h3 className="font-semibold text-lg">{record.title}</h3>
          </div>

          {/* Record-specific content display */}
          {record.recordType === "prescription" && record.medication && (
            <div className="text-sm space-y-1 ml-8">
              {record.medication.name && (
                <p>
                  <span className="font-medium">Medication:</span>{" "}
                  {record.medication.name}
                </p>
              )}
              {record.medication.dosage && (
                <p>
                  <span className="font-medium">Dosage:</span>{" "}
                  {record.medication.dosage}
                </p>
              )}
              {record.medication.frequency && (
                <p>
                  <span className="font-medium">Frequency:</span>{" "}
                  {record.medication.frequency}
                </p>
              )}
              {record.medication.duration && (
                <p>
                  <span className="font-medium">Duration:</span>{" "}
                  {record.medication.duration}
                </p>
              )}
            </div>
          )}

          {record.recordType === "lab_report" && record.labTest && (
            <div className="text-sm space-y-1 ml-8">
              {record.labTest.testName && (
                <p>
                  <span className="font-medium">Test:</span>{" "}
                  {record.labTest.testName}
                </p>
              )}
              {record.labTest.result && (
                <p>
                  <span className="font-medium">Result:</span>{" "}
                  {record.labTest.result}
                  {record.labTest.unit && ` ${record.labTest.unit}`}
                </p>
              )}
              {record.labTest.status && (
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  {record.labTest.status}
                </p>
              )}
            </div>
          )}

          {record.recordType === "vitals" && record.vitals && (
            <div className="text-sm space-y-1 ml-8">
              {record.vitals.temperature && (
                <p>
                  <span className="font-medium">Temp:</span>{" "}
                  {record.vitals.temperature}
                </p>
              )}
              {record.vitals.bloodPressure && (
                <p>
                  <span className="font-medium">BP:</span>{" "}
                  {record.vitals.bloodPressure}
                </p>
              )}
              {record.vitals.heartRate && (
                <p>
                  <span className="font-medium">HR:</span>{" "}
                  {record.vitals.heartRate}
                </p>
              )}
            </div>
          )}

          {record.recordType === "diagnosis" && record.notes && (
            <p className="text-sm ml-8 mt-2">{record.notes}</p>
          )}

          {record.content && !record.notes && (
            <p className="text-sm ml-8 mt-2">{record.content}</p>
          )}

          {record.createdAt && (
            <p className="text-xs mt-3 opacity-70">
              {new Date(record.createdAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {isPatient && (
          <div className="flex gap-2 ml-4">
            <button
              onClick={generatePDF}
              disabled={downloading}
              title="Download as PDF"
              className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
            >
              {downloading ? (
                <span className="text-xl">⏳</span>
              ) : (
                <span className="text-xl">📥</span>
              )}
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-2">Error: {error}</p>
      )}
    </div>
  );
};

export default RecordCard;
