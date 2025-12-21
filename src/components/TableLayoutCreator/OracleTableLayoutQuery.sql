SELECT 
       t.tablespace_name,
       t.table_name,
       tc.comments AS table_comment,
       c.column_id,
       c.column_name,
       CASE 
            WHEN c.data_type IN ('VARCHAR2','CHAR','NCHAR','NVARCHAR2') 
                 THEN c.data_type || '(' || c.char_length || ')'
            WHEN c.data_type IN ('NUMBER') AND c.data_precision IS NOT NULL 
                 THEN c.data_type || '(' || c.data_precision || ',' || c.data_scale || ')'
            WHEN c.data_type IN ('NUMBER') AND c.data_precision IS NULL 
                 THEN c.data_type
            WHEN c.data_type IN ('RAW') 
                 THEN c.data_type || '(' || c.data_length || ')'
            ELSE c.data_type
       END AS data_type,
       c.nullable,
       cc.comments AS column_comment,

       /* PK 컬럼 여부 */
       CASE WHEN pk.column_name IS NOT NULL THEN 'Y' ELSE 'N' END AS is_pk,

       /* PK 이름 + PK 컬럼 LISTAGG 조합 (요청한 부분) */
       (
            SELECT pk2.constraint_name || ' = ' ||
                   LISTAGG(pk2.column_name, ',') WITHIN GROUP (ORDER BY pk2.position)
            FROM user_cons_columns pk2
            WHERE pk2.table_name = t.table_name
              AND pk2.constraint_name = pk.constraint_name
            GROUP BY pk2.constraint_name
       ) AS constraint_desc,
       c.DATA_DEFAULT,
       pk.CONSTRAINT_NAME as remark
FROM user_tables t
JOIN user_tab_columns c
     ON t.table_name = c.table_name
LEFT JOIN user_col_comments cc
       ON c.table_name = cc.table_name
      AND c.column_name = cc.column_name
LEFT JOIN user_tab_comments tc
       ON t.table_name = tc.table_name

/* PK JOIN */
LEFT JOIN (
      SELECT ucc.table_name, ucc.column_name, ucc.position, ucc.constraint_name
      FROM user_constraints uc
      JOIN user_cons_columns ucc
        ON uc.constraint_name = ucc.constraint_name
       AND uc.constraint_type = 'P'
) pk
ON c.table_name = pk.table_name
AND c.column_name = pk.column_name
ORDER BY t.table_name, c.column_id;