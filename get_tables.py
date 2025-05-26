#!/usr/bin/env python3
import asyncio
import asyncpg
import json

async def get_database_info():
    # Supabase 連接參數
    project_ref = "bbmkuiplnzvpudszrend"
    password = "vusfyf-vytfEr-qohqy0"
    region = "us-east-1"
    
    # 嘗試不同的連接字符串格式
    connection_strings = [
        f"postgresql://postgres:{password}@db.{project_ref}.supabase.co:5432/postgres",
        f"postgresql://postgres.{project_ref}:{password}@aws-0-{region}.pooler.supabase.com:6543/postgres",
        f"postgresql://postgres:{password}@aws-0-{region}.pooler.supabase.com:6543/postgres?sslmode=require"
    ]
    
    for i, connection_string in enumerate(connection_strings, 1):
        try:
            print(f"🔄 嘗試連接方式 {i}...")
            print(f"   連接字符串: {connection_string.replace(password, '***')}")
            
            # 連接到資料庫
            conn = await asyncpg.connect(connection_string)
            print("✅ 成功連接到Supabase資料庫")
            
            # 獲取所有表格和視圖
            query = """
            SELECT 
                schemaname,
                tablename,
                tableowner
            FROM pg_tables 
            WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
            UNION ALL
            SELECT 
                schemaname,
                viewname as tablename,
                viewowner as tableowner
            FROM pg_views 
            WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
            ORDER BY schemaname, tablename;
            """
            
            tables = await conn.fetch(query)
            
            print(f"\n📊 找到 {len(tables)} 個表格/視圖:")
            print("=" * 80)
            
            # 按schema分組顯示
            current_schema = None
            for table in tables:
                if table['schemaname'] != current_schema:
                    current_schema = table['schemaname']
                    print(f"\n🗂️  Schema: {current_schema}")
                    print("-" * 40)
                
                print(f"   📋 {table['tablename']} (擁有者: {table['tableowner']})")
                
                # 獲取表格欄位信息
                columns_query = """
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default,
                    character_maximum_length
                FROM information_schema.columns 
                WHERE table_schema = $1 AND table_name = $2
                ORDER BY ordinal_position;
                """
                
                columns = await conn.fetch(columns_query, table['schemaname'], table['tablename'])
                
                if columns:
                    print("      欄位:")
                    for col in columns:
                        nullable = "可空" if col['is_nullable'] == 'YES' else "不可空"
                        default = f" (預設: {col['column_default']})" if col['column_default'] else ""
                        length = f"({col['character_maximum_length']})" if col['character_maximum_length'] else ""
                        print(f"        • {col['column_name']}: {col['data_type']}{length} - {nullable}{default}")
                print()
            
            # 獲取外鍵關係
            fk_query = """
            SELECT
                tc.table_schema,
                tc.table_name,
                kcu.column_name,
                ccu.table_schema AS foreign_table_schema,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema NOT IN ('information_schema', 'pg_catalog')
            ORDER BY tc.table_schema, tc.table_name;
            """
            
            foreign_keys = await conn.fetch(fk_query)
            
            if foreign_keys:
                print("\n🔗 外鍵關係:")
                print("=" * 80)
                for fk in foreign_keys:
                    print(f"   {fk['table_schema']}.{fk['table_name']}.{fk['column_name']} → {fk['foreign_table_schema']}.{fk['foreign_table_name']}.{fk['foreign_column_name']}")
            
            await conn.close()
            print("\n✅ 資料庫連接已關閉")
            return  # 成功連接，退出函數
            
        except Exception as e:
            print(f"❌ 連接方式 {i} 失敗: {e}")
            continue
    
    print("\n❌ 所有連接方式都失敗了")

if __name__ == "__main__":
    asyncio.run(get_database_info()) 