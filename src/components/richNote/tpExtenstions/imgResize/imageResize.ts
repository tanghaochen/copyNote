// 导入 TipTap 的 Image 扩展模块
import Image from "@tiptap/extension-image";

// 创建支持图片缩放和对齐的自定义扩展（继承自 Image 扩展）
export const ImageResize = Image.extend({
  // 扩展属性配置
  addAttributes() {
    return {
      // 继承父类（Image 扩展）的属性
      ...this.parent?.(),
      // 自定义 style 属性处理逻辑
      style: {
        // 默认样式：100% 宽度、自动高度、指针光标
        default: "width: 100%; height: auto; cursor: pointer;",
        // HTML 解析规则
        parseHTML: (element) => {
          // 优先使用 width 属性生成样式
          const width = element.getAttribute("width");
          return width
            ? `width: ${width}px; height: auto; cursor: pointer;`
            : `${element.style.cssText}`; // 保留原始样式
        },
      },
    };
  },

  // 创建自定义节点视图（核心功能实现）
  addNodeView() {
    return ({ node, editor, getPos }) => {
      // 从编辑器实例获取视图和可编辑状态
      const {
        view,
        options: { editable },
      } = editor;

      // 从节点属性获取当前样式
      const { style } = node.attrs;

      // 创建 DOM 元素结构
      const $wrapper = document.createElement("div"); // 外层包裹容器
      const $container = document.createElement("div"); // 图片容器（包含控制元素）
      const $img = document.createElement("img"); // 实际图片元素
      const iconStyle = "width: 24px; height: 24px; cursor: pointer;"; // 对齐图标统一样式

      // 更新节点属性的函数
      const dispatchNodeView = () => {
        // 确保存在获取位置的方法
        if (typeof getPos === "function") {
          // 创建新属性对象，合并原始属性和更新后的样式
          const newAttrs = {
            ...node.attrs,
            style: `${$img.style.cssText}`, // 获取图片当前样式
          };
          // 通过事务更新节点标记
          view.dispatch(view.state.tr.setNodeMarkup(getPos(), null, newAttrs));
        }
      };

      // 创建对齐控制栏的函数
      const paintPositionContoller = () => {
        // 创建控制栏容器
        const $postionController = document.createElement("div");

        // 创建三个对齐按钮
        const $leftController = document.createElement("img");
        const $centerController = document.createElement("img");
        const $rightController = document.createElement("img");

        // 鼠标悬停效果处理函数
        const controllerMouseOver = (e) => {
          e.target.style.opacity = 0.3; // 悬停时透明度降低
        };
        const controllerMouseOut = (e) => {
          e.target.style.opacity = 1; // 移出时恢复透明度
        };

        // 设置控制栏容器样式
        $postionController.setAttribute(
          "style",
          "position: absolute;" +
            "top: 0%;" +
            "left: 50%;" +
            "width: 100px;" +
            "height: 25px;" +
            "z-index: 999;" +
            "background-color: white;" +
            "border-radius: 4px;" +
            "cursor: pointer;" +
            "transform: translate(-50%, -150%);" +
            "display: flex;" +
            "justify-content: space-between;" +
            "align-items: center;" +
            "padding: 0 10px;",
        );
        // 添加阴影样式类
        $postionController.classList.add("shadow-md");

        // 配置左对齐按钮
        $leftController.setAttribute(
          "src",
          "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/format_align_left/default/20px.svg",
        );
        $leftController.setAttribute("style", iconStyle);
        $leftController.addEventListener("mouseover", controllerMouseOver);
        $leftController.addEventListener("mouseout", controllerMouseOut);
        // 左对齐点击事件
        $leftController.addEventListener("click", () => {
          $img.setAttribute(
            "style",
            `${$img.style.cssText} margin: 0 auto 0 0;`, // 设置左对齐边距
          );
          dispatchNodeView(); // 更新节点属性
        });

        // 配置居中对齐按钮
        $centerController.setAttribute(
          "src",
          "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/format_align_center/default/20px.svg",
        );
        $centerController.setAttribute("style", iconStyle);
        $centerController.addEventListener("mouseover", controllerMouseOver);
        $centerController.addEventListener("mouseout", controllerMouseOut);
        // 居中对齐点击事件
        $centerController.addEventListener("click", () => {
          $img.setAttribute("style", `${$img.style.cssText} margin: 0 auto;`);
          dispatchNodeView();
        });

        // 配置右对齐按钮
        $rightController.setAttribute(
          "src",
          "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/format_align_right/default/20px.svg",
        );
        $rightController.setAttribute("style", iconStyle);
        $rightController.addEventListener("mouseover", controllerMouseOver);
        $rightController.addEventListener("mouseout", controllerMouseOut);
        // 右对齐点击事件
        $rightController.addEventListener("click", () => {
          $img.setAttribute(
            "style",
            `${$img.style.cssText} margin: 0 0 0 auto;`, // 设置右对齐边距
          );
          dispatchNodeView();
        });

        // 将按钮添加到控制栏
        $postionController.appendChild($leftController);
        $postionController.appendChild($centerController);
        $postionController.appendChild($rightController);

        // 将控制栏添加到图片容器
        $container.appendChild($postionController);
      };

      // 设置外层容器样式
      $wrapper.setAttribute("style", `display: flex;`);
      $wrapper.appendChild($container);

      // 初始化图片容器样式
      $container.setAttribute("style", `${style}`);
      $container.appendChild($img);

      // 将节点属性应用到图片元素
      Object.entries(node.attrs).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        $img.setAttribute(key, value);
      });

      // 非编辑模式直接返回基础结构
      if (!editable) return { dom: $container };

      // 移动端适配参数
      const isMobile = document.documentElement.clientWidth < 768;
      const dotPosition = isMobile ? "-8px" : "-4px"; // 调整点偏移量
      // 四个调整点的定位样式配置
      const dotsPosition = [
        `top: ${dotPosition}; left: ${dotPosition}; cursor: nwse-resize;`, // 左上调整点
        `top: ${dotPosition}; right: ${dotPosition}; cursor: nesw-resize;`, // 右上调整点
        `bottom: ${dotPosition}; left: ${dotPosition}; cursor: nesw-resize;`, // 左下调整点
        `bottom: ${dotPosition}; right: ${dotPosition}; cursor: nwse-resize;`, // 右下调整点
      ];

      // 调整大小相关状态变量
      let isResizing = false; // 是否正在调整大小
      let startX: number; // 调整开始时的X坐标
      let startWidth: number; // 调整开始时的容器宽度

      // 容器点击事件处理（激活控制元素）
      $container.addEventListener("click", (e) => {
        // 移动端处理：移除编辑器焦点防止虚拟键盘弹出
        isMobile &&
          (
            document.querySelector(".ProseMirror-focused") as HTMLElement
          )?.blur();

        // 清理已有的控制元素（防止重复添加）
        if ($container.childElementCount > 3) {
          for (let i = 0; i < 5; i++) {
            $container.removeChild($container.lastChild as Node);
          }
        }

        // 创建对齐控制栏
        paintPositionContoller();

        // 添加激活状态样式（边框）
        $container.setAttribute(
          "style",
          `position: relative;  border: 1px solid rgba(0, 0, 0, 0.2); ${style} cursor: pointer;`,
        );

        // 创建四个调整点
        Array.from({ length: 4 }, (_, index) => {
          const $dot = document.createElement("div");
          // 设置调整点样式
          $dot.setAttribute(
            "style",
            `position: absolute; width: ${isMobile ? 16 : 9}px; height: ${
              isMobile ? 16 : 9
            }px; border: 1px solid rgba(0, 0, 0, 0.2); border-radius: 50%; ${
              dotsPosition[index]
            }`,
          );

          // 鼠标按下事件（开始调整）
          $dot.addEventListener("mousedown", (e) => {
            e.preventDefault();
            isResizing = true;
            startX = e.clientX; // 记录起始X坐标
            startWidth = $container.offsetWidth; // 记录当前宽度

            // 鼠标移动处理函数
            const onMouseMove = (e: MouseEvent) => {
              if (!isResizing) return;
              // 计算横向变化量（根据调整点位置决定方向）
              const deltaX =
                index % 2 === 0
                  ? -(e.clientX - startX) // 左侧调整点反向计算
                  : e.clientX - startX; // 右侧调整点正向计算

              // 计算新宽度
              const newWidth = startWidth + deltaX;

              // 更新容器和图片宽度
              $container.style.width = newWidth + "px";
              $img.style.width = newWidth + "px";
            };

            // 鼠标抬起事件（结束调整）
            const onMouseUp = () => {
              if (isResizing) {
                isResizing = false;
              }
              dispatchNodeView(); // 提交属性更新

              // 清理事件监听
              document.removeEventListener("mousemove", onMouseMove);
              document.removeEventListener("mouseup", onMouseUp);
            };

            // 注册全局事件
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
          });

          // 触摸事件处理（移动端支持）
          $dot.addEventListener(
            "touchstart",
            (e) => {
              e.cancelable && e.preventDefault();
              isResizing = true;
              startX = e.touches[0].clientX; // 获取首个触摸点
              startWidth = $container.offsetWidth;

              // 触摸移动处理
              const onTouchMove = (e: TouchEvent) => {
                if (!isResizing) return;
                const deltaX =
                  index % 2 === 0
                    ? -(e.touches[0].clientX - startX)
                    : e.touches[0].clientX - startX;

                const newWidth = startWidth + deltaX;

                $container.style.width = newWidth + "px";
                $img.style.width = newWidth + "px";
              };

              // 触摸结束处理
              const onTouchEnd = () => {
                if (isResizing) {
                  isResizing = false;
                }
                dispatchNodeView();

                // 清理事件监听
                document.removeEventListener("touchmove", onTouchMove);
                document.removeEventListener("touchend", onTouchEnd);
              };

              document.addEventListener("touchmove", onTouchMove);
              document.addEventListener("touchend", onTouchEnd);
            },
            { passive: false }, // 明确禁用被动模式以确保 preventDefault 生效
          );

          // 将调整点添加到容器
          $container.appendChild($dot);
        });
      });

      // 全局点击监听（点击外部区域时隐藏控制元素）
      document.addEventListener("click", (e: MouseEvent) => {
        const $target = e.target as HTMLElement;
        // 判断点击是否发生在控制元素内部
        const isClickInside =
          $container.contains($target) || $target.style.cssText === iconStyle; // 检查是否点击对齐图标

        // 如果点击在外部区域
        if (!isClickInside) {
          // 移除激活状态边框
          const containerStyle = $container.getAttribute("style");
          const newStyle = containerStyle?.replace(
            " border: 1px solid rgba(0, 0, 0, 0.2)",
            "",
          );
          $container.setAttribute("style", newStyle as string);

          // 移除所有控制元素
          if ($container.childElementCount > 3) {
            for (let i = 0; i < 5; i++) {
              $container.removeChild($container.lastChild as Node);
            }
          }
        }
      });

      // 返回最终生成的 DOM 结构
      return {
        dom: $wrapper,
      };
    };
  },
});
