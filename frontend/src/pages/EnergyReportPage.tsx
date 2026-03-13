import { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';

export default function EnergyReportPage() {
  const [reports] = useState([
    { id: 1, name: '2024年2月能耗分析报告', period: '2024-02', date: '2024-03-01', size: '2.5MB' },
    { id: 2, name: '2024年1月能耗分析报告', period: '2024-01', date: '2024-02-01', size: '2.3MB' },
    { id: 3, name: '2023年Q4季度能耗报告', period: 'Q4 2023', date: '2024-01-05', size: '5.8MB' },
    { id: 4, name: '2023年度能耗分析报告', period: '2023全年', date: '2024-01-10', size: '12.5MB' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📊 能耗报告</h2>
          <p className="text-gray-500 mt-1">能耗数据统计与分析报告</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
          <Calendar size={20} /> 生成报告
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><FileText className="text-blue-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">报告总数</p><p className="text-2xl font-bold">{reports.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><FileText className="text-green-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">本月报告</p><p className="text-2xl font-bold">1</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><FileText className="text-purple-600" size={24} /></div>
            <div><p className="text-sm text-gray-500">总大小</p><p className="text-2xl font-bold">23.1MB</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">报告名称</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">周期</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">生成日期</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">大小</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{report.name}</td>
                  <td className="px-4 py-3 text-gray-600">{report.period}</td>
                  <td className="px-4 py-3 text-gray-600">{report.date}</td>
                  <td className="px-4 py-3 text-gray-600">{report.size}</td>
                  <td className="px-4 py-3">
                    <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                      <Download size={16} /> 下载
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
