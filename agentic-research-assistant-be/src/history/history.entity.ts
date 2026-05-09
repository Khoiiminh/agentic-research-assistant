import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('history')
export class History {
  @PrimaryGeneratedColumn('uuid')
  chat_id!: string;

  @Column('uuid')
  user_id!: string;

  @Column({ type: 'text', default: '' })
  chat_summary!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}