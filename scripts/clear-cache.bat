@echo off
echo 正在清理Vite缓存...
rmdir /s /q node_modules\.vite
rmdir /s /q .vite_cache
echo 正在清理node_modules/.cache...
rmdir /s /q node_modules\.cache
echo 缓存已清理完成
pause 