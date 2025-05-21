import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Box,
  Typography,
  createTheme,
  ThemeProvider,
  useTheme,
} from "@mui/material";
import { autocompleteClasses } from "@mui/material/Autocomplete";

interface EditorOption {
  value: "cursor" | "vscode" | "idea";
  label: string;
  icon: string;
}

const editorOptions: EditorOption[] = [
  { value: "vscode", label: "Visual Studio Code", icon: "/statics/vscode.png" },
  { value: "idea", label: "IntelliJ IDEA", icon: "/statics/idea.png" },
  { value: "cursor", label: "Cursor", icon: "/statics/cursor.png" },
];

interface CodeJumpDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  initialValues?: {
    editorType: "cursor" | "vscode" | "idea";
    filePath: string;
    displayName: string;
    lineNumber: number;
  };
}

const customTheme = (outerTheme: any) =>
  createTheme({
    components: {
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            backgroundColor: "#fff",
          },
          listbox: {
            backgroundColor: "#fff",
            "& .MuiAutocomplete-option": {
              backgroundColor: "#fff",
              color: "rgba(0, 0, 0, 0.87)",
              "&[aria-selected='true']": {
                backgroundColor: "#EAEAEA !important",
              },
            },
          },
        },
      },
    },
  });

export default function CodeJumpDialog({
  open,
  onClose,
  onSubmit,
  initialValues,
}) {
  const outerTheme = useTheme();
  const [values, setValues] = React.useState({
    editorType: initialValues?.editorType || "vscode",
    filePath: initialValues?.filePath || "",
    displayName: initialValues?.displayName || "",
    lineNumber: initialValues?.lineNumber || 1,
  });

  const [errors, setErrors] = React.useState({
    filePath: false,
  });

  const handleChange = (field: string) => (event: any) => {
    setValues({
      ...values,
      [field]: event.target.value,
    });
    // 清除错误状态
    if (field === "filePath") {
      setErrors({ ...errors, filePath: false });
    }
  };

  const handleSubmit = () => {
    // 验证必填字段
    if (!values.filePath.trim()) {
      setErrors({ ...errors, filePath: true });
      return;
    }

    onSubmit(values);
  };

  const selectedEditor = editorOptions.find(
    (opt) => opt.value === values.editorType,
  );

  return (
    <ThemeProvider theme={customTheme(outerTheme)}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>代码跳转</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <Autocomplete
              value={selectedEditor}
              onChange={(_, newValue) => {
                if (newValue) {
                  setValues({ ...values, editorType: newValue.value });
                }
              }}
              options={editorOptions}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="编辑器"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#fff",
                    },
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box
                    key={key}
                    component="li"
                    {...otherProps}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      padding: "8px",
                      color: "rgba(0, 0, 0, 0.87)",
                      backgroundColor: "#fff !important",
                    }}
                  >
                    <img
                      src={option.icon}
                      alt={option.label}
                      style={{ width: 20, height: 20 }}
                    />
                    <Typography sx={{ color: "inherit" }}>
                      {option.label}
                    </Typography>
                  </Box>
                );
              }}
            />
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="文件路径"
            value={values.filePath}
            onChange={handleChange("filePath")}
            error={errors.filePath}
            helperText={errors.filePath ? "文件路径为必填项" : ""}
            required
          />

          <TextField
            fullWidth
            margin="normal"
            label="显示名称"
            value={values.displayName}
            onChange={handleChange("displayName")}
          />

          <TextField
            fullWidth
            margin="normal"
            label="行号"
            type="number"
            value={values.lineNumber}
            onChange={handleChange("lineNumber")}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            确定
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
