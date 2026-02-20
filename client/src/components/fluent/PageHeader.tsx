import * as React from "react";
import {
  Body1,
  makeStyles,
  mergeClasses,
  shorthands,
  Subtitle1,
  Title2,
  tokens,
} from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    rowGap: tokens.spacingVerticalM,
    columnGap: tokens.spacingHorizontalL,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    boxShadow: tokens.shadow4,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXS,
    minWidth: 0,
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
    maxWidth: "70ch",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalS,
  },
});

type PageHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, eyebrow, actions, className }: PageHeaderProps) {
  const styles = useStyles();

  return (
    <header className={mergeClasses(styles.root, className)}>
      <div className={styles.content}>
        {eyebrow ? <Body1>{eyebrow}</Body1> : null}
        <Title2>{title}</Title2>
        {subtitle ? <Subtitle1 className={styles.subtitle}>{subtitle}</Subtitle1> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
