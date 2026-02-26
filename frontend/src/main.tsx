import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";

import { StyleProvider } from "@ant-design/cssinjs";
import { App, ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";

import { router } from "./router";

import "./index.css";

import "dayjs/locale/zh-cn";

dayjs.locale("zh-cn");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#7c3aed",
          colorLink: "#60a5fa",
          colorSuccess: "#34d399",
          colorWarning: "#fbbf24",
          colorError: "#f87171",
          colorBgBase: "#0d0d1a",
          colorBgContainer: "rgba(255, 255, 255, 0.04)",
          colorBgElevated: "#1a1040",
          colorBorder: "rgba(139, 92, 246, 0.2)",
          colorBorderSecondary: "rgba(139, 92, 246, 0.12)",
          colorText: "#e2e8f0",
          colorTextSecondary: "#94a3b8",
          borderRadius: 8,
          fontFamily: '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif',
        },
        components: {
          Menu: {
            darkItemBg: "transparent",
            darkSubMenuItemBg: "transparent",
            darkItemSelectedBg: "rgba(124, 58, 237, 0.15)",
          },
          Table: {
            headerBg: "rgba(139, 92, 246, 0.08)",
            rowHoverBg: "rgba(139, 92, 246, 0.06)",
          },
          Modal: {
            contentBg: "#1a1040",
            headerBg: "#1a1040",
          },
          Card: {
            colorBgContainer: "rgba(255, 255, 255, 0.04)",
          },
        },
      }}
    >
      <StyleProvider layer>
        <App>
          <RouterProvider router={router} />
        </App>
      </StyleProvider>
    </ConfigProvider>
  </React.StrictMode>,
);
