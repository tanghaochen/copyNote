import * as React from "react";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import { Editor } from "@tiptap/react";

const paragraphTList = [
  { label: "正文" },
  { label: "标题1" },
  { label: "标题2" },
  { label: "标题3" },
  { label: "标题4" },
  { label: "标题5" },
  { label: "标题6" },
];

interface ParagraphSelectorProps {
  editor: Editor;
}

const ParagraphSelector = ({ editor }: ParagraphSelectorProps) => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [selectedLabel, setSelectedLabel] = React.useState("正文");

  // 获取当前段落状态
  const currentValue = React.useMemo(() => {
    if (!editor) return "正文";
    for (let level = 1; level <= 6; level++) {
      if (editor.isActive("heading", { level })) {
        return `标题${level}`;
      }
    }
    return "正文";
  }, [editor?.state]);

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement>,
    label: string,
  ) => {
    setSelectedLabel(label);
    if (label === "正文") {
      editor?.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(label.replace("标题", ""));
      editor?.chain().focus().toggleHeading({ level }).run();
    }
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    setOpen(false);
  };

  const renderCurrentElement = () => {
    const isParagraph = currentValue === "正文";
    return React.createElement(
      isParagraph ? "p" : currentValue.replace("标题", "h"),
      {
        style: {
          fontSize: isParagraph
            ? "1rem"
            : `${2 - (parseInt(currentValue.slice(2)) - 1) * 0.2}rem`,
          fontWeight: isParagraph ? 400 : 600,
          margin: 0,
          lineHeight: 1.3,
        },
      },
      currentValue,
    );
  };

  return (
    <React.Fragment>
      <ButtonGroup
        variant="none"
        ref={anchorRef}
        aria-label="paragraph selector"
        className="ml-2"
      >
        <Button
          onClick={() => {
            editor?.chain().focus().setParagraph().run();
            setSelectedLabel("正文");
          }}
          style={{ minWidth: 100, justifyContent: "flex-start" }}
        >
          {currentValue}
        </Button>
        <Button
          size="small"
          aria-controls={open ? "paragraph-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          onClick={handleToggle}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>

      <Popper
        open={open}
        sx={{ zIndex: 1 }}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="paragraph-menu">
                  {paragraphTList.map(({ label }) => {
                    const isParagraph = label === "正文";
                    const elementType = isParagraph
                      ? "p"
                      : `h${label.slice(2)}`;
                    return (
                      <MenuItem
                        key={label}
                        selected={label === currentValue}
                        onClick={(event) => handleMenuItemClick(event, label)}
                      >
                        {React.createElement(
                          elementType,
                          {
                            style: {
                              fontSize: isParagraph
                                ? "1rem"
                                : `${
                                    2 - (parseInt(label.slice(2)) - 1) * 0.2
                                  }rem`,
                              fontWeight: isParagraph ? 400 : 600,
                              margin: 0,
                              lineHeight: 1.3,
                            },
                          },
                          label,
                        )}
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </React.Fragment>
  );
};

export default ParagraphSelector;
