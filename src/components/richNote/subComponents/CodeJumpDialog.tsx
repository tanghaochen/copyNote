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
} from "@mui/material";

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

export default function CodeJumpDialog({
  open,
  onClose,
  onSubmit,
  initialValues,
}) {
  const [values, setValues] = React.useState({
    editorType: initialValues?.editorType || "vscode",
    filePath: initialValues?.filePath || "",
    displayName: initialValues?.displayName || "",
    lineNumber: initialValues?.lineNumber || 1,
  });

  const handleChange = (field: string) => (event: any) => {
    setValues({
      ...values,
      [field]: event.target.value,
    });
  };

  const handleSubmit = () => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>代码跳转</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>编辑器</InputLabel>
          <Select
            value={values.editorType}
            onChange={handleChange("editorType")}
            label="编辑器"
          >
            <MenuItem value="vscode">VSCode</MenuItem>
            <MenuItem value="idea">IDEA</MenuItem>
            <MenuItem value="cursor">Cursor</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          margin="normal"
          label="文件路径"
          value={values.filePath}
          onChange={handleChange("filePath")}
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
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          确定
        </Button>
      </DialogActions>
    </Dialog>
  );
}
