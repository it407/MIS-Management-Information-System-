import jsPDF from "jspdf";
import "jspdf-autotable";

// Semicircle chart generator (reference code se)
const generateSemicircleChartImage = (topScorers) => {
  const canvas = document.createElement("canvas");
  const pixelRatio = window.devicePixelRatio || 2;

  const logicalWidth = 800;
  const logicalHeight = 400;

  canvas.width = logicalWidth * pixelRatio;
  canvas.height = logicalHeight * pixelRatio;
  canvas.style.width = logicalWidth + "px";
  canvas.style.height = logicalHeight + "px";

  const ctx = canvas.getContext("2d");
  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // Semicircle Setup
  const centerX = logicalWidth / 2;
  const centerY = 300;
  const outerRadius = 180;
  const innerRadius = 120;

  const colors = ["#8DD9D5", "#6BBBEA", "#BEA1E8", "#FFB77D", "#FF99A8"];
  const totalAngle = Math.PI;
  let currentAngle = Math.PI;

  const totalScore = topScorers.reduce(
    (sum, emp) => sum + (emp.weeklyWorkDone || 0),
    0
  );

  // Base semicircle
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI, true);
  ctx.arc(centerX, centerY, innerRadius, Math.PI, 0, false);
  ctx.closePath();
  ctx.fillStyle = "#f3f4f6";
  ctx.fill();

  // Draw segments
  topScorers.forEach((emp, index) => {
    const segmentAngle = ((emp.weeklyWorkDone || 0) / totalScore) * totalAngle;
    const startAngle = currentAngle;
    const endAngle = currentAngle + segmentAngle;
    const midAngle = startAngle + segmentAngle / 2;

    ctx.save();
    ctx.beginPath();

    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();

    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      innerRadius,
      centerX,
      centerY,
      outerRadius
    );
    gradient.addColorStop(0, colors[index % colors.length]);
    gradient.addColorStop(1, colors[index % colors.length] + "cc");
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Score text
    if (segmentAngle > 0.15) {
      const textRadius = (outerRadius + innerRadius) / 2;
      const textX = centerX + Math.cos(midAngle) * textRadius;
      const textY = centerY + Math.sin(midAngle) * textRadius;

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText((emp.weeklyWorkDone || 0).toString(), textX, textY);
    }

    currentAngle += segmentAngle;
  });

  // Legend
  const legendY = 50;
  topScorers.forEach((emp, index) => {
    const y = legendY + index * 25;

    ctx.beginPath();
    ctx.arc(40, y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();

    ctx.fillStyle = "#1f2937";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(emp.name, 55, y + 4);
  });

  return canvas.toDataURL("image/png", 1.0);
};

// Bar chart generator for lowest scorers
const generateBarChartImage = (scorers, title, color) => {
  const canvas = document.createElement("canvas");
  const width = 400;
  const height = 300;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const maxScore = Math.max(...scorers.map((s) => s.weeklyWorkDone || 0), 1);
  const barWidth = (width - 60) / scorers.length;
  const chartHeight = height - 80;

  // Draw bars
  scorers.forEach((emp, index) => {
    const barHeight = ((emp.weeklyWorkDone || 0) / maxScore) * chartHeight;
    const x = 40 + index * barWidth;
    const y = height - 60 - barHeight;

    // Bar
    ctx.fillStyle = color || "#f59e0b";
    ctx.fillRect(x, y, barWidth - 10, barHeight);

    // Score
    ctx.fillStyle = "#000";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      (emp.weeklyWorkDone || 0).toString(),
      x + (barWidth - 10) / 2,
      y - 5
    );

    // Name
    ctx.save();
    ctx.translate(x + (barWidth - 10) / 2, height - 40);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(emp.name.substring(0, 10), 0, 0);
    ctx.restore();
  });

  return canvas.toDataURL("image/png", 1.0);
};

export const generateDashboardPDF = async (
  // async keyword add करें
  filteredEmployees,
  departments,
  topScorers,
  lowestScorers,
  employeesByPending,
  selectedEmployees,
  employeeCommitments,
  filterDepartment,
  filterFMS,
  uniqueDepartments
) => {
  try {
    const doc = new jsPDF("p", "mm", "a4");
    const today = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let yPosition = 20;

    // ==================== HEADER ====================
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.setFont("helvetica", "bold");
    doc.text("MIS Dashboard Report", pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${today}`, pageWidth / 2, 22, { align: "center" });

    // Line separator
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.5);
    doc.line(margin, 25, pageWidth - margin, 25);

    yPosition = 30;

    // ==================== FILTER INFO ====================
    const activeFilters = [];
    if (filterDepartment) activeFilters.push(`Department: ${filterDepartment}`);
    if (filterFMS) activeFilters.push(`FMS: ${filterFMS}`);

    if (activeFilters.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(59, 130, 246);
      doc.text(
        `Active Filters: ${activeFilters.join(", ")}`,
        margin,
        yPosition
      );
      yPosition += 8;
    }

    // ==================== LIST OF PEOPLE TABLE ====================
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.text("1. List of People", margin, yPosition);
    yPosition += 10;

    // Get table headers
    const tableHeaders = [
      "ID",
      "Name",
      "Department",
      "FMS",
      "Target %",
      "Actual %",
      "Weekly %",
      "On Time %",
      "Total %",
      "Week Pending",
      "All Pending",
      "Not Done %",
      "Late %",
      "Commitment %",
    ];

    const employeeData = filteredEmployees.map((emp) => [
      emp.id || "",
      emp.name || "",
      emp.department || "",
      emp.fmsName || "-",
      emp.target ? `${emp.target}%` : "0%",
      emp.actualWorkDone ? `${emp.actualWorkDone}%` : "0%",
      emp.weeklyWorkDone ? `${emp.weeklyWorkDone}%` : "0%",
      emp.weeklyWorkDoneOnTime ? `${emp.weeklyWorkDoneOnTime}%` : "0%",
      emp.totalWorkDone ? `${emp.totalWorkDone}%` : "0%",
      emp.weekPending || 0,
      emp.allPendingTillDate || 0,
      emp.plannedWorkNotDone ? `${emp.plannedWorkNotDone}%` : "0%",
      emp.plannedWorkNotDoneOnTime ? `${emp.plannedWorkNotDoneOnTime}%` : "0%",
      emp.commitment ? `${emp.commitment}%` : "0%",
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [tableHeaders],
      body: employeeData,
      theme: "striped",
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontSize: 7,
        cellPadding: 2,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 6,
        cellPadding: 1.5,
        textColor: [55, 65, 81],
      },
      styles: {
        fontSize: 6,
        cellPadding: 1.5,
        overflow: "linebreak",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center" },
        1: { cellWidth: 25, halign: "left" },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 20, halign: "center" },
        4: { cellWidth: 12, halign: "center" },
        5: { cellWidth: 12, halign: "center" },
        6: { cellWidth: 12, halign: "center" },
        7: { cellWidth: 12, halign: "center" },
        8: { cellWidth: 12, halign: "center" },
        9: { cellWidth: 12, halign: "center" },
        10: { cellWidth: 12, halign: "center" },
        11: { cellWidth: 12, halign: "center" },
        12: { cellWidth: 12, halign: "center" },
        13: { cellWidth: 12, halign: "center" },
      },
      margin: { left: margin, right: margin },
      didDrawCell: function (data) {
        // Color coding for scores
        if ([4, 5, 6, 7, 8, 11, 12, 13].includes(data.column.index)) {
          const value = parseFloat(data.cell.text[0]) || 0;
          if (value >= 80) {
            data.cell.styles.textColor = [34, 197, 94]; // Green
          } else if (value >= 60) {
            data.cell.styles.textColor = [245, 158, 11]; // Yellow
          } else {
            data.cell.styles.textColor = [239, 68, 68]; // Red
          }
        }

        // Color coding for pending tasks
        if ([9, 10].includes(data.column.index)) {
          const value = parseFloat(data.cell.text[0]) || 0;
          if (value === 0) {
            data.cell.styles.textColor = [34, 197, 94]; // Green
          } else if (value <= 3) {
            data.cell.styles.textColor = [245, 158, 11]; // Yellow
          } else {
            data.cell.styles.textColor = [239, 68, 68]; // Red
          }
        }
      },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // ==================== NEW PAGE FOR CHARTS ====================
    doc.addPage();
    let chartYPosition = 20; // Changed variable name

    // ==================== TOP 5 SCORERS ====================
    doc.setFontSize(13);
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.text("2. Top 5 Scorers (Weekly Work Done %)", margin, chartYPosition);
    chartYPosition += 10;

    // Smaller container for both chart and table side by side
    if (topScorers.length > 0) {
      // Left side: Chart
      const chartImage = generateSemicircleChartImage(topScorers);
      // doc.addImage(chartImage, "PNG", margin, chartYPosition, 70, 35); // Reduced size
      doc.addImage(chartImage, "PNG", margin, chartYPosition, 100, 50);

      // Right side: Table
      const topScorersTableData = topScorers.map((emp, index) => [
        index + 1,
        emp.name,
        `${emp.weeklyWorkDone}%`,
      ]);

      doc.autoTable({
        startY: chartYPosition - 2,
        head: [["#", "Name", "Weekly Done %"]],
        body: topScorersTableData,
        theme: "striped",
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold",
        },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 12, halign: "center" },
          1: { cellWidth: 45, halign: "left" },
          2: {
            cellWidth: 25,
            halign: "center",
            textColor: [34, 197, 94],
            fontStyle: "bold",
          },
        },
        // margin: { left: margin + 80 }, 
        margin: { left: margin + 110 },
        tableWidth: 80, // Narrower table
      });
    }

    chartYPosition += 55; // Reduced spacing

    // ==================== PENDING TASKS BY USER ====================
    chartYPosition += 12;

    doc.setFontSize(13);
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.text("3. Pending Tasks by User", margin, chartYPosition);
    chartYPosition += 10;

    // Compact horizontal bar chart for pending tasks
    if (employeesByPending.length > 0) {
      const maxPending = Math.max(
        ...employeesByPending.map((e) => e.allPendingTillDate || 0),
        1
      );
      const barHeight = 5; // Smaller bars
      const startY = chartYPosition;

      // Limit to top 5-6 users for compactness
      const displayUsers = employeesByPending.slice(0, 6);

      displayUsers.forEach((emp, index) => {
        const barWidth = ((emp.allPendingTillDate || 0) / maxPending) * 100; // Reduced width
        const y = startY + index * 8; // Reduced spacing

        // Bar background
        doc.setFillColor(241, 245, 249);
        doc.rect(margin + 35, y, 100, barHeight, "F");

        // Progress bar with gradient-like effect
        doc.setFillColor(220, 38, 38);
        doc.rect(margin + 35, y, barWidth, barHeight, "F");

        // Name (truncated)
        doc.setFontSize(6);
        doc.setTextColor(0, 0, 0);
        doc.text(emp.name.substring(0, 12), margin, y + 3);

        // Value
        doc.setFont("helvetica", "bold");
        doc.text((emp.allPendingTillDate || 0).toString(), margin + 140, y + 3);
      });

      // Add mini legend
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Showing ${displayUsers.length} users with highest pending tasks`,
        margin,
        chartYPosition + displayUsers.length * 8 + 5
      );

      chartYPosition += displayUsers.length * 8 + 10;
    }

    // ==================== LOWEST SCORES ====================

    chartYPosition += 15;
    doc.setFontSize(13);
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.text("4. Lowest Scores (Weekly Work Done %)", margin, chartYPosition);
    chartYPosition += 10;

    if (lowestScorers.length > 0) {
      // Left side: More attractive bar chart
      const chartImage = generateBarChartImage(
        lowestScorers,
        "Lowest Scores",
        "#ef4444" // Red color
      );
      doc.addImage(chartImage, "PNG", margin, chartYPosition, 70, 35); // Reduced size

      // Right side: Compact table
      const lowestScorersTableData = lowestScorers.map((emp, index) => [
        index + 1,
        emp.name,
        `${emp.weeklyWorkDone}%`,
      ]);

      doc.autoTable({
        startY: chartYPosition - 2,
        head: [["#", "Name", "Weekly Done %"]],
        body: lowestScorersTableData,
        theme: "striped",
        headStyles: {
          fillColor: [239, 68, 68], // Red header
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [75, 85, 99], // Gray text
        },
        columnStyles: {
          0: {
            cellWidth: 12,
            halign: "center",
            fillColor: [254, 242, 242], // Light red background
          },
          1: {
            cellWidth: 45,
            halign: "left",
            fillColor: [254, 242, 242],
          },
          2: {
            cellWidth: 25,
            halign: "center",
            textColor: [239, 68, 68],
            fontStyle: "bold",
            fillColor: [254, 242, 242],
          },
        },
        margin: { left: margin + 80 },
        tableWidth: 80,
      });
    }
    // ==================== NEW PAGE FOR DEPARTMENT SCORES ====================
    // doc.addPage();
    // yPosition = 20;

    // ==================== DEPARTMENT SCORES ====================
    // ==================== DEPARTMENT SCORES ====================
    // doc.addPage();
    // yPosition = 20;

    // doc.setFontSize(14);
    // doc.setTextColor(31, 41, 55);
    // doc.setFont("helvetica", "bold");
    // doc.text("5. Department Scores", margin, yPosition);

    // if (filterFMS) {
    //   doc.setFontSize(9);
    //   doc.setTextColor(59, 130, 246);
    //   doc.text(`Filtered by FMS: ${filterFMS}`, margin, yPosition + 6);
    // }
    // yPosition += 15;

    // // Draw department bars
    // if (departments && departments.length > 0) {
    //   const maxScore = 100;
    //   const barWidth = 12;
    //   const startX = margin;

    //   // डेटा को सॉर्ट करें (highest score first)
    //   const sortedDepts = [...departments].sort(
    //     (a, b) => (b.score || 0) - (a.score || 0)
    //   );

    //   // केवल top 8 डिपार्टमेंट्स दिखाएं
    //   const topDepartments = sortedDepts.slice(0, 8);

    //   topDepartments.forEach((dept, index) => {
    //     // डिपार्टमेंट का स्कोर लें
    //     const score = dept.score || 0;
    //     const barHeight = (score / maxScore) * 80;
    //     const x = startX + index * (barWidth + 15); // More spacing
    //     const y = yPosition + 80 - barHeight;

    //     // Bar with gradient effect
    //     doc.setFillColor(124, 58, 237); // Purple color
    //     doc.rect(x, y, barWidth, barHeight, "F");

    //     // Score on top of bar
    //     doc.setFontSize(7);
    //     doc.setTextColor(0, 0, 0);
    //     doc.setFont("helvetica", "bold");
    //     doc.text(`${score}%`, x + barWidth / 2, y - 4, {
    //       align: "center",
    //     });

    //     // Department name (rotated)
    //     doc.save();
    //     doc.translate(x + barWidth / 2, yPosition + 92);
    //     doc.rotate(-Math.PI / 4);
    //     doc.setFontSize(6);
    //     doc.setTextColor(75, 85, 99);

    //     // Department name with truncation
    //     let deptName = dept.department || dept.name || "Unknown";
    //     if (deptName.length > 10) {
    //       deptName = deptName.substring(0, 10) + "...";
    //     }
    //     doc.text(deptName, 0, 0);
    //     doc.restore();

    //     // Employee count below department name
    //     doc.setFontSize(5);
    //     doc.setTextColor(107, 114, 128);
    //     if (dept.employeesCount || dept.employeeCount) {
    //       const empCount = dept.employeesCount || dept.employeeCount || 0;
    //       doc.text(`${empCount} emp`, x + barWidth / 2, yPosition + 100, {
    //         align: "center",
    //       });
    //     }
    //   });

    //   yPosition += 110;
    // } else {
    //   doc.setFontSize(10);
    //   doc.setTextColor(156, 163, 175);
    //   doc.text("No department data available", margin, yPosition + 40);
    //   yPosition += 50;
    // }

    // ==================== OVERALL SCORE ====================
    // Calculate available space for chart
    const currentPageHeight = doc.internal.pageSize.getHeight();
    const remainingSpace = currentPageHeight - yPosition;

    // Add new page if not enough space for chart (minimum 150mm)
    if (remainingSpace < 150) {
      doc.addPage();
      yPosition = 20;
    }

    // Department graph code
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Department Scores", margin, yPosition);
    yPosition += 10;

    const chartContainerWidth = pageWidth - margin * 2;
    const chartContainerHeight = 120;

    doc.setFillColor(255, 255, 255);
    doc.rect(margin, yPosition, chartContainerWidth, chartContainerHeight, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPosition, chartContainerWidth, chartContainerHeight);

    try {
      const DEPARTMENT_CHART_ID = "1932717403";
      const chartImageUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vQevflaEBcHCIR2_hEsSC154BDiqUBrNYWTkzPrSLqtjPyB7pCpg8WhTeGyQwyJePlfsHjP3SR9jv1X/pubchart?oid=${DEPARTMENT_CHART_ID}&format=image`;

      const chartImage = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load chart image"));
        img.src = chartImageUrl;
      });

      const maxWidth = chartContainerWidth - 10;
      const maxHeight = chartContainerHeight - 10;
      let chartWidth = chartImage.width;
      let chartHeight = chartImage.height;

      if (chartWidth > maxWidth) {
        const ratio = maxWidth / chartWidth;
        chartWidth = maxWidth;
        chartHeight = chartHeight * ratio;
      }

      if (chartHeight > maxHeight) {
        const ratio = maxHeight / chartHeight;
        chartHeight = maxHeight;
        chartWidth = chartWidth * ratio;
      }

      const chartX = margin + (chartContainerWidth - chartWidth) / 2;
      const chartY = yPosition + (chartContainerHeight - chartHeight) / 2;

      doc.addImage(chartImage, "PNG", chartX, chartY, chartWidth, chartHeight);
    } catch (error) {
      console.error("Failed to load department chart:", error);
      doc.setFontSize(10);
      doc.setTextColor(220, 38, 38);
      doc.text(
        "Could not load Department Scores chart",
        margin + 5,
        yPosition + 15
      );
      doc.setTextColor(100, 100, 100);
      doc.text(
        "Please check the Google Sheets permissions and chart ID",
        margin + 5,
        yPosition + 25
      );
    }

    yPosition += chartContainerHeight + 15;

    // Continue with footer...
    // ==================== FOOTER ====================
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Page number
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const pageText = `Page ${i} of ${pageCount}`;
      doc.text(pageText, pageWidth - 20, 287);

      // Footer text
      const footerText = "Powered by Botivate";
      const websiteLink = "www.botivate.in";
      doc.setTextColor(100, 116, 139);
      doc.text(footerText, margin, 287);
      doc.setTextColor(59, 130, 246);
      doc.textWithLink(websiteLink, margin + 40, 287, {
        url: "https://www.botivate.in",
      });
    }

    // Save PDF
    doc.save(`MIS-Dashboard-Report-${today.replace(/\//g, "-")}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  }
};
